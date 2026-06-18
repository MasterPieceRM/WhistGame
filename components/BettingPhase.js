'use client';

import { useState, useCallback } from 'react';
import styles from './GamePhase.module.css';
import { getDealerIndex, getStarterIndex } from '@/utils/gameLogic';
import EntityAvatar from './EntityAvatar';

/**
 * BettingPhase Component
 * Shows one popup per entity to place their bet individually.
 */
export default function BettingPhase({ entities, roundIndex, cardsThisRound, onSubmit }) {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [bets, setBets] = useState(new Array(entities.length).fill(0));
  const [currentBet, setCurrentBet] = useState(0);

  const dealerIdx = getDealerIndex(roundIndex, entities.length);
  const starterIdx = getStarterIndex(dealerIdx, entities.length);

  const handleConfirmBet = useCallback(() => {
    const newBets = [...bets];
    newBets[currentPlayerIdx] = currentBet;
    setBets(newBets);

    if (currentPlayerIdx < entities.length - 1) {
      setCurrentPlayerIdx(currentPlayerIdx + 1);
      setCurrentBet(0);
    } else {
      // All bets placed
      onSubmit(newBets);
    }
  }, [bets, currentBet, currentPlayerIdx, entities.length, onSubmit]);

  const entity = entities[currentPlayerIdx];
  const isDealer = currentPlayerIdx === dealerIdx;
  const isStarter = currentPlayerIdx === starterIdx;

  return (
    <div className={styles.phase}>
      {/* Round info header */}
      <div className={styles.header}>
        <div className={styles.roundInfo}>
          <div>
            <div className={styles.roundNumber}>Runda {roundIndex + 1} / 27</div>
          </div>
          <div className={styles.roundCards}>
            <span className={styles.cardsIcon}>🃏</span>
            <span className={styles.cardsCount}>{cardsThisRound}</span>
            <span className={styles.cardsLabel}>{cardsThisRound === 1 ? 'carte' : 'cărți'}</span>
          </div>
        </div>
        <h2 className={styles.phaseTitle}>Pariuri</h2>
      </div>

      {/* Already completed bets */}
      {currentPlayerIdx > 0 && (
        <div className={styles.completedList}>
          {entities.slice(0, currentPlayerIdx).map((e, i) => (
            <div key={e.id || i} className={styles.completedItem}>
              <span className={styles.completedCheck}>✓</span>
              <span className={styles.completedName}>{e.name}</span>
              <span className={styles.completedValue}>
                Pariu: {bets[i]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pre-round announcement popup */}
      {showAnnouncement && (
        <div className={styles.popupOverlay}>
          <div className={styles.announcementCard}>
            <div className={styles.announcementRound}>
              Runda {roundIndex + 1} / 27
            </div>
            <div className={styles.announcementCards}>
              <span className={styles.cardsIcon}>🃏</span>
              <span className={styles.announcementCardsCount}>{cardsThisRound}</span>
              <span className={styles.announcementCardsLabel}>
                {cardsThisRound === 1 ? 'carte' : 'cărți'}
              </span>
            </div>
            <div className={styles.announcementDivider} />
            <div className={styles.announcementRow}>
              <span className={`${styles.popupRoleBadge} ${styles.popupDealerBadge}`}>🃏 Împarte</span>
              <EntityAvatar entity={entities[dealerIdx]} size={36} />
              <span className={styles.announcementName}>{entities[dealerIdx].name}</span>
            </div>
            <div className={styles.announcementRow}>
              <span className={`${styles.popupRoleBadge} ${styles.popupStarterBadge}`}>▶ Începe</span>
              <EntityAvatar entity={entities[starterIdx]} size={36} />
              <span className={styles.announcementName}>{entities[starterIdx].name}</span>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ marginTop: '1.5rem', width: '100%' }}
              onClick={() => setShowAnnouncement(false)}
            >
              Să începem! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Individual player popup */}
      {!showAnnouncement && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupCard}>
            {/* Progress dots */}
            <div className={styles.popupProgress}>
              {entities.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.popupProgressDot} ${i === currentPlayerIdx
                    ? styles.popupProgressDotActive
                    : i < currentPlayerIdx
                      ? styles.popupProgressDotDone
                      : ''
                    }`}
                />
              ))}
            </div>

            {/* Avatar */}
            <div className={styles.popupAvatarWrap}>
              <EntityAvatar entity={entity} size={130} />
            </div>

            {/* Player name */}
            <div className={styles.popupPlayerName}>{entity.name}</div>

            {/* Role badges */}
            <div className={styles.popupPlayerRole}>
              {isDealer && (
                <span className={`${styles.popupRoleBadge} ${styles.popupDealerBadge}`}>
                  🃏 Împarte
                </span>
              )}
              {isStarter && (
                <span className={`${styles.popupRoleBadge} ${styles.popupStarterBadge}`}>
                  ▶ Începe
                </span>
              )}
              {!isDealer && !isStarter && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Jucător {currentPlayerIdx + 1} din {entities.length}
                </span>
              )}
            </div>

            {/* Bet label */}
            <div className={styles.popupLabel}>
              Câte mâini crezi că vei lua?
            </div>

            {/* Large stepper */}
            <div className={styles.popupStepper}>
              <button
                className={styles.popupStepperBtn}
                onClick={() => setCurrentBet((v) => Math.max(0, v - 1))}
                disabled={currentBet <= 0}
              >
                −
              </button>
              <div className={styles.popupStepperValue}>{currentBet}</div>
              <button
                className={styles.popupStepperBtn}
                onClick={() => setCurrentBet((v) => Math.min(cardsThisRound, v + 1))}
                disabled={currentBet >= cardsThisRound}
              >
                +
              </button>
            </div>

            {/* Confirm button */}
            <button className="btn btn-primary btn-lg" onClick={handleConfirmBet}>
              {currentPlayerIdx < entities.length - 1
                ? `Confirmă → ${entities[currentPlayerIdx + 1].name}`
                : 'Confirmă & Începe Runda'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

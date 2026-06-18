'use client';

import { useState, useCallback } from 'react';
import styles from './GamePhase.module.css';
import { calculateRoundScore, calculateConsecutiveBonus } from '@/utils/gameLogic';
import EntityAvatar from './EntityAvatar';

const WIN_VIDEOS = [
  '/win_popups/noice.mp4',
  '/win_popups/rock-eyebrow.mp4',
  '/win_popups/whatsapp.mp4',
];

const LOSE_VIDEOS = [
  '/lose_popups/crying.mp4',
  '/lose_popups/cat-laugh.mp4',
  '/lose_popups/mutahar-laugh.mp4',
];

/**
 * ResultsPhase Component
 * Shows one popup per entity to enter hands taken.
 * After confirming, reveals the score before moving to next player.
 */
export default function ResultsPhase({
  entities,
  bets,
  cardsThisRound,
  consecutives,
  onSubmit,
  onBack,
}) {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [taken, setTaken] = useState(new Array(entities.length).fill(0));
  const [currentTaken, setCurrentTaken] = useState(0);
  const [showingScore, setShowingScore] = useState(false);
  const [revealedScore, setRevealedScore] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);

  const handleConfirmTaken = useCallback(() => {
    const newTaken = [...taken];
    newTaken[currentPlayerIdx] = currentTaken;
    setTaken(newTaken);

    // Calculate and reveal score
    const { score, won } = calculateRoundScore(bets[currentPlayerIdx], currentTaken);
    const { bonus } = calculateConsecutiveBonus(consecutives[currentPlayerIdx], won);
    setRevealedScore({ score, bonus, total: score + bonus, won, bet: bets[currentPlayerIdx], taken: currentTaken });

    const pool = won ? WIN_VIDEOS : LOSE_VIDEOS;
    setVideoSrc(pool[Math.floor(Math.random() * pool.length)]);

    setShowingScore(true);
  }, [taken, currentPlayerIdx, currentTaken, bets, consecutives]);

  const handleNextPlayer = useCallback(() => {
    setShowingScore(false);
    setRevealedScore(null);
    setVideoSrc(null);

    if (currentPlayerIdx < entities.length - 1) {
      setCurrentPlayerIdx(currentPlayerIdx + 1);
      setCurrentTaken(0);
    } else {
      // All done — submit results
      const finalTaken = [...taken];
      finalTaken[currentPlayerIdx] = currentTaken;
      onSubmit(finalTaken);
    }
  }, [currentPlayerIdx, entities.length, taken, currentTaken, onSubmit]);

  const entity = entities[currentPlayerIdx];

  return (
    <div className={styles.phase}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.phaseTitle}>Rezultate</h2>
        <p className={styles.phaseSubtitle}>Câte mâini a luat fiecare?</p>
      </div>

      {/* Completed results list */}
      {currentPlayerIdx > 0 && (
        <div className={styles.completedList}>
          {entities.slice(0, currentPlayerIdx).map((e, i) => {
            const { score, won } = calculateRoundScore(bets[i], taken[i]);
            const { bonus } = calculateConsecutiveBonus(consecutives[i], won);
            const total = score + bonus;
            return (
              <div key={e.id || i} className={styles.completedItem}>
                <span className={styles.completedCheck}>✓</span>
                <span className={styles.completedName}>{e.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {bets[i]}p / {taken[i]}l
                </span>
                <span
                  className={`${styles.completedScore} ${won ? styles.completedScoreWin : styles.completedScoreLose
                    }`}
                >
                  {total > 0 ? `+${total}` : total}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual player popup */}
      <div className={styles.popupOverlay}>
        {showingScore && videoSrc && (
          <video
            key={`left-${videoSrc}`}
            className={styles.sideVideoLeft}
            src={videoSrc}
            autoPlay
            loop
            playsInline
          />
        )}
        <div className={styles.popupCard} key={`${currentPlayerIdx}-${showingScore}`}>
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

          {!showingScore ? (
            <>
              {/* Bet info */}
              <div className={styles.popupBetInfo}>
                A pariat: <span className={styles.popupBetHighlight}>{bets[currentPlayerIdx]}</span>
                {bets[currentPlayerIdx] === 1 ? ' mână' : ' mâini'}
              </div>

              {/* Input label */}
              <div className={styles.popupLabel}>
                Câte mâini a luat de fapt?
              </div>

              {/* Large stepper */}
              <div className={styles.popupStepper}>
                <button
                  className={styles.popupStepperBtn}
                  onClick={() => setCurrentTaken((v) => Math.max(0, v - 1))}
                  disabled={currentTaken <= 0}
                >
                  −
                </button>
                <div className={styles.popupStepperValue}>{currentTaken}</div>
                <button
                  className={styles.popupStepperBtn}
                  onClick={() => setCurrentTaken((v) => Math.min(cardsThisRound, v + 1))}
                  disabled={currentTaken >= cardsThisRound}
                >
                  +
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                {currentPlayerIdx === 0 && (
                  <button className="btn btn-secondary" onClick={onBack}>
                    ← Înapoi la Pariuri
                  </button>
                )}
                <button className="btn btn-primary btn-lg" onClick={handleConfirmTaken}>
                  Confirmă ✓
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Score Reveal */}
              <div
                className={`${styles.scoreReveal} ${revealedScore.won ? styles.scoreRevealWin : styles.scoreRevealLose
                  }`}
              >
                <div className={styles.scoreRevealLabel}>
                  {revealedScore.won ? '✅ Pariu câștigat!' : '❌ Pariu pierdut'}
                </div>
                <div className={styles.scoreRevealValue}>
                  {revealedScore.score > 0 ? `+${revealedScore.score}` : revealedScore.score}
                </div>
                <div className={styles.scoreRevealDetail}>
                  Pariat {revealedScore.bet}, luat {revealedScore.taken}
                </div>
                {revealedScore.bonus !== 0 && (
                  <div
                    className={`${styles.scoreRevealBonus} ${revealedScore.bonus > 0
                      ? styles.scoreRevealBonusPositive
                      : styles.scoreRevealBonusNegative
                      }`}
                  >
                    {revealedScore.bonus > 0 ? '+' : ''}{revealedScore.bonus} bonus consecutiv!
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleNextPlayer}>
                {currentPlayerIdx < entities.length - 1
                  ? `Următorul → ${entities[currentPlayerIdx + 1].name}`
                  : 'Vezi Tabelul de Scor →'}
              </button>
            </>
          )}
        </div>
        {showingScore && videoSrc && (
          <video
            key={`right-${videoSrc}`}
            className={styles.sideVideoRight}
            src={videoSrc}
            autoPlay
            loop
            playsInline
          />
        )}
      </div>
    </div>
  );
}

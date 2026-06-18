'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import BettingPhase from '@/components/BettingPhase';
import ResultsPhase from '@/components/ResultsPhase';
import ScoreTable from '@/components/ScoreTable';
import FinalScreen from '@/components/FinalScreen';
import {
  generateRoundSequence,
  getDealerIndex,
  getStarterIndex,
  processRoundResults,
  getCumulativeScores,
} from '@/utils/gameLogic';
import { loadGameState, saveGameState, clearGameState, saveGameToHistory } from '@/utils/playerStore';

const ROUND_SEQUENCE = generateRoundSequence();
const TOTAL_ROUNDS = ROUND_SEQUENCE.length; // 27

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [showFinal, setShowFinal] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = loadGameState();
    if (!saved) {
      router.push('/');
      return;
    }
    setGameState(saved);
  }, [router]);

  const persistState = useCallback((newState) => {
    setGameState(newState);
    saveGameState(newState);
  }, []);

  const handleBetsSubmit = useCallback((bets) => {
    persistState({
      ...gameState,
      phase: 'results',
      bets,
    });
  }, [gameState, persistState]);

  const handleResultsSubmit = useCallback((taken) => {
    const results = gameState.entities.map((_, i) => ({
      bet: gameState.bets[i],
      taken: taken[i],
    }));

    const roundResults = processRoundResults(results, gameState.consecutives);
    const newHistory = [...gameState.roundsHistory, roundResults];
    const newConsecutives = roundResults.map((r) => r.newConsecutive);
    const newRound = gameState.currentRound + 1;

    const newState = {
      ...gameState,
      currentRound: newRound,
      roundsHistory: newHistory,
      consecutives: newConsecutives,
      phase: 'scoreTable',
      bets: [],
      lastRoundResults: roundResults,
    };

    persistState(newState);

    // Check if game is over
    if (newRound >= TOTAL_ROUNDS) {
      const finalScores = getCumulativeScores(newHistory);
      saveGameToHistory({
        id: Date.now().toString(36),
        finishedAt: new Date().toISOString(),
        entities: gameState.entities.map((e, i) => ({ ...e, totalScore: finalScores[i] })),
        rounds: newHistory.length,
        totalScores: finalScores,
        partial: false,
      });
      setShowFinal(true);
    }
  }, [gameState, persistState]);

  const handleBackToBetting = useCallback(() => {
    persistState({
      ...gameState,
      phase: 'betting',
      bets: [],
    });
  }, [gameState, persistState]);

  const handleNextRound = useCallback(() => {
    persistState({
      ...gameState,
      phase: 'betting',
      lastRoundResults: null,
    });
  }, [gameState, persistState]);

  const handleEndGame = useCallback(() => {
    setShowConfirmEnd(false);
    if (gameState && gameState.roundsHistory.length > 0) {
      const finalScores = getCumulativeScores(gameState.roundsHistory);
      saveGameToHistory({
        id: Date.now().toString(36),
        finishedAt: new Date().toISOString(),
        entities: gameState.entities.map((e, i) => ({ ...e, totalScore: finalScores[i] })),
        rounds: gameState.roundsHistory.length,
        totalScores: finalScores,
        partial: true,
      });
    }
    setShowFinal(true);
  }, [gameState]);

  const handleNewGame = useCallback(() => {
    clearGameState();
    router.push('/');
  }, [router]);

  if (!mounted || !gameState) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.loading}>
          <div className={styles.loadingIcon}>🃏</div>
          <div className={styles.loadingText}>Se încarcă jocul...</div>
        </div>
      </div>
    );
  }

  const { entities, currentRound, roundsHistory, phase, bets, consecutives, lastRoundResults } =
    gameState;
  const totalScores = getCumulativeScores(roundsHistory);
  const cardsThisRound = ROUND_SEQUENCE[currentRound] || 1;
  const dealerIdx = getDealerIndex(currentRound, entities.length);
  const starterIdx = getStarterIndex(dealerIdx, entities.length);
  const progressPercent = (roundsHistory.length / TOTAL_ROUNDS) * 100;

  return (
    <div className={`${styles.page} container`}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.gameTitle}>
            🃏 Whist
          </div>
          <div className={styles.roundBadge}>
            Runda {Math.min(currentRound + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
            <span style={{ margin: '0 0.25rem', opacity: 0.5 }}>•</span>
            {cardsThisRound} {cardsThisRound === 1 ? 'carte' : 'cărți'}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className={styles.topBarRight}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowConfirmEnd(true)}
          >
            Oprește Jocul
          </button>
        </div>
      </div>

      {/* Score Overview */}
      <div className={styles.scoreOverview}>
        {entities.map((entity, i) => (
          <div
            key={entity.id || i}
            className={`${styles.scoreChip} ${i === dealerIdx && phase === 'betting' ? styles.isDealer : ''
              } ${i === starterIdx && phase === 'betting' ? styles.isStarter : ''}`}
          >
            <span className={styles.scoreChipName}>{entity.name}</span>
            <span
              className={`${styles.scoreChipScore} ${totalScores[i] > 0
                  ? styles.scoreChipPositive
                  : totalScores[i] < 0
                    ? styles.scoreChipNegative
                    : styles.scoreChipZero
                }`}
            >
              {totalScores[i] > 0 ? `+${totalScores[i]}` : totalScores[i] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* Game Phases */}
      {phase === 'betting' && (
        <BettingPhase
          entities={entities}
          roundIndex={currentRound}
          cardsThisRound={cardsThisRound}
          onSubmit={handleBetsSubmit}
        />
      )}

      {phase === 'results' && (
        <ResultsPhase
          entities={entities}
          bets={bets}
          cardsThisRound={cardsThisRound}
          consecutives={consecutives}
          onSubmit={handleResultsSubmit}
          onBack={handleBackToBetting}
        />
      )}

      {phase === 'scoreTable' && (
        <div className={styles.scoreTableView}>
          {/* Round Summary */}
          {lastRoundResults && (
            <div className={styles.roundSummary}>
              <div className={styles.roundSummaryTitle}>
                Rezumat Runda {roundsHistory.length}
              </div>
              <div className={styles.summaryCards}>
                {lastRoundResults.map((result, i) => (
                  <div
                    key={i}
                    className={`${styles.summaryCard} ${result.won ? styles.summaryCardWin : styles.summaryCardLose
                      }`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <span className={styles.summaryName}>{entities[i].name}</span>
                    <span className={styles.summaryDetail}>
                      {result.bet}p / {result.taken}l
                    </span>
                    <span
                      className={styles.summaryScore}
                      style={{
                        color: result.won ? 'var(--green-400)' : 'var(--red-400)',
                      }}
                    >
                      {result.score > 0 ? `+${result.score}` : result.score}
                    </span>
                    {result.bonus !== 0 && (
                      <span
                        className={`${styles.summaryBonus} ${result.bonus > 0
                            ? styles.summaryBonusPositive
                            : styles.summaryBonusNegative
                          }`}
                      >
                        {result.bonus > 0 ? `+${result.bonus}` : result.bonus}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Table Header */}
          <div className={styles.scoreTableHeader}>
            <h2 className={styles.scoreTableTitle}>Tabel Scor</h2>
            <p className={styles.scoreTableSubtitle}>
              {currentRound >= TOTAL_ROUNDS
                ? 'Toate rundele au fost jucate!'
                : `${TOTAL_ROUNDS - currentRound} runde rămase`}
            </p>
          </div>

          {/* Score Table */}
          <ScoreTable
            entities={entities}
            roundsHistory={roundsHistory}
            currentRoundIndex={roundsHistory.length - 1}
            totalScores={totalScores}
          />

          {/* Actions */}
          <div className={styles.scoreTableActions}>
            {currentRound >= TOTAL_ROUNDS ? (
              <button className="btn btn-primary btn-lg" onClick={() => setShowFinal(true)}>
                🏆 Vezi Clasamentul Final
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleNextRound}>
                Runda Următoare →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final Screen */}
      {showFinal && (
        <FinalScreen
          entities={entities}
          totalScores={totalScores}
          roundsHistory={roundsHistory}
          onNewGame={handleNewGame}
        />
      )}

      {/* Confirm End Dialog */}
      {showConfirmEnd && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirmEnd(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>Oprești jocul?</div>
            <div className={styles.confirmText}>
              S-au jucat {roundsHistory.length} din {TOTAL_ROUNDS} runde.
              Câștigătorul va fi cel cu cele mai multe puncte.
            </div>
            <div className={styles.confirmActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmEnd(false)}
              >
                Continuă Jocul
              </button>
              <button className="btn btn-danger" onClick={handleEndGame}>
                Oprește
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

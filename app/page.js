'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import PlayerSelector from '@/components/PlayerSelector';
import { loadGameState, clearGameState, saveGameState, loadGameHistory, syncHistoryFromServer } from '@/utils/playerStore';
import EntityAvatar from '@/components/EntityAvatar';

export default function Home() {
  const router = useRouter();
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [savedGame, setSavedGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const game = loadGameState();
    if (game) setSavedGame(game);
    setGameHistory(loadGameHistory());
    // Sync history from server (picks up games played on other devices)
    syncHistoryFromServer().then(setGameHistory);
  }, []);

  const canStart = selectedEntities.length >= 3 && selectedEntities.length <= 12;

  const handleStartGame = () => {
    const gameState = {
      entities: selectedEntities,
      currentRound: 0,
      roundsHistory: [],
      consecutives: new Array(selectedEntities.length).fill(0),
      phase: 'betting',
      bets: [],
    };
    saveGameState(gameState);
    router.push('/game');
  };

  const handleResumeGame = () => {
    router.push('/game');
  };

  const handleDiscardGame = () => {
    clearGameState();
    setSavedGame(null);
  };

  if (!mounted) {
    return (
      <div className={`${styles.page} container`}>
        <div className={styles.header}>
          <div className={styles.logo}>🃏</div>
          <h1 className={styles.title}>Whist</h1>
          <p className={styles.subtitle}>Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} container`}>
      <div className={styles.header}>
        <div className={styles.logo}>🃏</div>
        <h1 className={styles.title}>Whist</h1>
        <p className={styles.subtitle}>
          Score tracker pentru jocul de Whist adaptat. Adaugă jucătorii, formează echipele și ține scorul.
        </p>
      </div>

      {/* Resume saved game */}
      {savedGame && (
        <div className={styles.resumeCard}>
          <div className={styles.resumeInfo}>
            <div className={styles.resumeTitle}>🎮 Joc în desfășurare</div>
            <div className={styles.resumeDetail}>
              Runda {savedGame.currentRound + 1} / 27 •{' '}
              {savedGame.entities.map((e) => e.name).join(', ')}
            </div>
          </div>
          <div className={styles.resumeActions}>
            <button className="btn btn-primary btn-sm" onClick={handleResumeGame}>
              Continuă
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDiscardGame}>
              Renunță
            </button>
          </div>
        </div>
      )}

      {/* Player Selection */}
      <PlayerSelector
        selectedEntities={selectedEntities}
        onEntitiesChange={setSelectedEntities}
      />

      {/* Start Game */}
      <div className={styles.startSection}>
        <div
          className={`${styles.validationMsg} ${selectedEntities.length > 0 && !canStart ? styles.validationError : ''
            }`}
        >
          {selectedEntities.length === 0
            ? 'Selectează sau adaugă minim 3 jucători / echipe pentru a începe'
            : selectedEntities.length < 3
              ? `Încă ${3 - selectedEntities.length} jucători necesari (minim 3)`
              : selectedEntities.length > 12
                ? 'Maxim 12 jucători / echipe permise'
                : `${selectedEntities.length} jucători / echipe selectate — gata de joc!`}
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStartGame}
          disabled={!canStart}
        >
          🎴 Începe Jocul
        </button>
      </div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <div className={styles.historySection}>
          <button
            className={styles.historyToggle}
            onClick={() => setShowHistory((v) => !v)}
          >
            📜 Istoricul Jocurilor ({gameHistory.length})
            <span className={styles.historyToggleIcon}>{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className={styles.historyList}>
              {gameHistory.map((game) => {
                const sorted = game.entities
                  .map((e, i) => ({ ...e, score: game.totalScores[i] }))
                  .sort((a, b) => b.score - a.score);
                const date = new Date(game.finishedAt);
                const dateStr = date.toLocaleDateString('ro-RO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                const timeStr = date.toLocaleTimeString('ro-RO', {
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={game.id} className={styles.historyEntry}>
                    <div className={styles.historyEntryHeader}>
                      <span className={styles.historyDate}>{dateStr} · {timeStr}</span>
                      {game.partial && (
                        <span className={styles.historyPartial}>joc întrerupt</span>
                      )}
                      <span className={styles.historyRounds}>{game.rounds} runde</span>
                    </div>
                    <div className={styles.historyPlayers}>
                      {sorted.map((e, rank) => (
                        <div key={e.id || rank} className={`${styles.historyPlayer} ${rank === 0 ? styles.historyWinner : ''}`}>
                          <EntityAvatar entity={e} size={28} />
                          <span className={styles.historyPlayerName}>{e.name}</span>
                          <span className={`${styles.historyScore} ${e.score > 0 ? styles.historyScorePos : e.score < 0 ? styles.historyScoreNeg : ''}`}>
                            {e.score > 0 ? `+${e.score}` : e.score}
                          </span>
                          {rank === 0 && <span className={styles.historyCrown}>👑</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

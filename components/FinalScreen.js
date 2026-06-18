'use client';

import { useEffect, useState } from 'react';
import styles from './FinalScreen.module.css';
import ScoreTable from './ScoreTable';

const CONFETTI_COLORS = [
  '#fde047', '#eab308', '#22c55e', '#3b82f6', '#ef4444',
  '#a855f7', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
];

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ConfettiEffect() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
      rotation: `${Math.random() * 360}deg`,
      size: `${6 + Math.random() * 8}px`,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className={styles.confetti}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className={styles.confettiPiece}
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function PodiumAvatar({ entity }) {
  const player = entity.players[0];
  if (player.photo) {
    return <img className={styles.podiumAvatarImg} src={player.photo} alt={player.name} />;
  }
  return (
    <div className={styles.podiumAvatar} style={{ background: getColorForName(player.name) }}>
      {getInitials(player.name)}
    </div>
  );
}

/**
 * FinalScreen Component
 * Shows final rankings with podium, confetti, and full score table.
 *
 * @param {Object} props
 * @param {Array} props.entities
 * @param {number[]} props.totalScores
 * @param {Array} props.roundsHistory
 * @param {Function} props.onNewGame
 */
export default function FinalScreen({ entities, totalScores, roundsHistory, onNewGame }) {
  // Create sorted ranking
  const ranked = entities
    .map((entity, i) => ({ entity, score: totalScores[i], originalIndex: i }))
    .sort((a, b) => b.score - a.score);

  const podiumEntities = ranked.slice(0, 3);
  const restEntities = ranked.slice(3);

  // Reorder podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (podiumEntities[1]) podiumOrder.push({ ...podiumEntities[1], place: 2 });
  if (podiumEntities[0]) podiumOrder.push({ ...podiumEntities[0], place: 1 });
  if (podiumEntities[2]) podiumOrder.push({ ...podiumEntities[2], place: 3 });

  const placeClass = {
    1: styles.podiumFirst,
    2: styles.podiumSecond,
    3: styles.podiumThird,
  };

  const placeEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={styles.overlay}>
      <ConfettiEffect />

      <div className={styles.content}>
        <div className={styles.crownIcon}>👑</div>
        <h1 className={styles.title}>Joc Terminat!</h1>
        <p className={styles.subtitle}>
          Felicitări, {ranked[0].entity.name}!
        </p>

        {/* Podium */}
        <div className={styles.podium}>
          {podiumOrder.map((item) => (
            <div
              key={item.entity.id || item.originalIndex}
              className={`${styles.podiumPlace} ${placeClass[item.place]}`}
            >
              <PodiumAvatar entity={item.entity} />
              <div className={styles.podiumName}>{item.entity.name}</div>
              <div className={styles.podiumScore}>
                {item.score > 0 ? `+${item.score}` : item.score}
              </div>
              <div className={styles.podiumBar}>
                {placeEmoji[item.place]}
              </div>
            </div>
          ))}
        </div>

        {/* Remaining players */}
        {restEntities.length > 0 && (
          <div className={styles.remaining}>
            {restEntities.map((item, i) => (
              <div key={item.entity.id || item.originalIndex} className={styles.remainingItem}>
                <span className={styles.remainingRank}>#{i + 4}</span>
                <span className={styles.remainingName}>{item.entity.name}</span>
                <span className={styles.remainingScore}>
                  {item.score > 0 ? `+${item.score}` : item.score}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Full score table */}
        <div className={styles.tableSection}>
          <h3 className={styles.tableSectionTitle}>Tabel Complet</h3>
          <ScoreTable
            entities={entities}
            roundsHistory={roundsHistory}
            currentRoundIndex={-1}
            totalScores={totalScores}
          />
        </div>

        <div className={styles.actions}>
          <button className="btn btn-primary btn-lg" onClick={onNewGame}>
            🎮 Joc Nou
          </button>
        </div>
      </div>
    </div>
  );
}

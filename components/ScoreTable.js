'use client';

import styles from './ScoreTable.module.css';
import { generateRoundSequence, getCumulativeScoresPerRound } from '@/utils/gameLogic';
import EntityAvatar from './EntityAvatar';

/**
 * ScoreTable Component
 * Full game score table with rounds as rows and entities as columns.
 *
 * @param {Object} props
 * @param {Array} props.entities - Game entities
 * @param {Array} props.roundsHistory - Array of round results
 * @param {number} props.currentRoundIndex - Current round (0-based)
 * @param {number[]} props.totalScores - Cumulative total scores per entity
 */
export default function ScoreTable({ entities, roundsHistory, currentRoundIndex, totalScores }) {
  const roundSequence = generateRoundSequence();
  const cumulativePerRound = getCumulativeScoresPerRound(roundsHistory);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Runda</th>
            {entities.map((entity, i) => (
              <th key={entity.id || i}>
                <div className={styles.headerCell}>
                  <EntityAvatar entity={entity} size={36} />
                  <span className={styles.headerName}>{entity.name}</span>
                  {entity.type === 'team' && (
                    <span className={styles.headerTeam}>
                      {entity.players.map((p) => p.name).join(' & ')}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundsHistory.map((round, roundIdx) => (
            <tr
              key={roundIdx}
              className={roundIdx === currentRoundIndex ? styles.currentRow : ''}
            >
              <td>
                <div className={styles.roundLabel}>
                  <span className={styles.roundNum}>{roundIdx + 1}</span>
                  <span className={styles.cardCount}>{roundSequence[roundIdx]}</span>
                </div>
              </td>
              {round.map((result, entityIdx) => (
                <td
                  key={entityIdx}
                  className={result.won ? styles.cellWin : styles.cellLose}
                >
                  <div className={styles.cellContent}>
                    <span className={styles.cellScore}>
                      {result.total > 0 ? `+${result.total}` : result.total}
                    </span>
                    <span className={styles.cellBetResult}>
                      {result.bet}p / {result.taken}l
                    </span>
                    {result.bonus !== 0 && (
                      <span
                        className={`${styles.cellBonus} ${result.bonus < 0 ? styles.cellBonusNeg : ''
                          }`}
                      >
                        {result.bonus > 0 ? `+${result.bonus}` : result.bonus} bonus
                      </span>
                    )}
                    {cumulativePerRound[roundIdx] && (
                      <span className={styles.cumulativeScore}>
                        Σ {cumulativePerRound[roundIdx][entityIdx]}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}

          {/* Future rounds (unplayed) */}
          {roundSequence.slice(roundsHistory.length, Math.min(roundsHistory.length + 3, roundSequence.length)).map(
            (cards, i) => {
              const absIdx = roundsHistory.length + i;
              return (
                <tr key={`future-${absIdx}`} style={{ opacity: 0.3 }}>
                  <td>
                    <div className={styles.roundLabel}>
                      <span className={styles.roundNum}>{absIdx + 1}</span>
                      <span className={styles.cardCount}>{cards}</span>
                    </div>
                  </td>
                  {entities.map((_, entityIdx) => (
                    <td key={entityIdx}>—</td>
                  ))}
                </tr>
              );
            }
          )}

          {/* Total row */}
          <tr className={styles.totalRow}>
            <td>TOTAL</td>
            {totalScores.map((score, i) => (
              <td key={i}>
                <span
                  className={`${styles.totalScore} ${score > 0 ? styles.totalScorePositive : score < 0 ? styles.totalScoreNegative : ''
                    }`}
                >
                  {score > 0 ? `+${score}` : score}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

'use client';

import styles from './PlayerCard.module.css';

// Predefined color palette for avatar backgrounds
const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
  '#fd79a8', '#00cec9',
];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AvatarDisplay({ player }) {
  if (player.photo) {
    return (
      <img
        className={styles.avatar}
        src={player.photo}
        alt={player.name}
      />
    );
  }
  return (
    <div
      className={styles.avatarPlaceholder}
      style={{ background: getColorForName(player.name) }}
    >
      {getInitials(player.name)}
    </div>
  );
}

/**
 * PlayerCard Component
 * Displays a player or team with avatar, name, score, and role badges.
 * 
 * @param {Object} props
 * @param {Object} props.entity - { type: 'player'|'team', name, players: [{id, name, photo}] }
 * @param {number} [props.score] - Current score
 * @param {boolean} [props.isDealer] - Whether this entity is the current dealer
 * @param {boolean} [props.isStarter] - Whether this entity starts the round
 * @param {boolean} [props.large] - Use large variant
 * @param {boolean} [props.winner] - Highlight as winner
 * @param {React.ReactNode} [props.children] - Extra content (e.g., input fields)
 */
export default function PlayerCard({
  entity,
  score,
  isDealer = false,
  isStarter = false,
  large = false,
  winner = false,
  children,
}) {
  const cardClasses = [
    styles.card,
    large && styles.cardLarge,
    isDealer && styles.isDealer,
    isStarter && styles.isStarter,
    winner && styles.winner,
  ]
    .filter(Boolean)
    .join(' ');

  const isTeam = entity.type === 'team';

  return (
    <div className={cardClasses}>
      <div className={styles.avatarWrap}>
        {isTeam ? (
          <div className={styles.teamAvatars}>
            {entity.players.map((p) => (
              <AvatarDisplay key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <AvatarDisplay player={entity.players[0]} />
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{entity.name}</div>
        {isTeam && (
          <div className={styles.teamNames}>
            {entity.players.map((p) => p.name).join(' & ')}
          </div>
        )}
        {(isDealer || isStarter) && (
          <div className={styles.roleBadges}>
            {isDealer && (
              <span className={`${styles.roleBadge} ${styles.dealerRoleBadge}`}>
                🃏 Împarte
              </span>
            )}
            {isStarter && (
              <span className={`${styles.roleBadge} ${styles.starterRoleBadge}`}>
                ▶ Începe
              </span>
            )}
          </div>
        )}
      </div>

      {score !== undefined && (
        <div
          className={`${styles.score} ${
            score > 0 ? styles.scorePositive : score < 0 ? styles.scoreNegative : ''
          }`}
        >
          {score > 0 ? `+${score}` : score}
        </div>
      )}

      {children}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './PlayerSelector.module.css';
import { getAllPlayers, savePlayer, deletePlayer, syncPlayersFromServer } from '@/utils/playerStore';

const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * PlayerSelector Component
 * Manages saved players, team creation, and entity selection for a game.
 *
 * @param {Object} props
 * @param {Array} props.selectedEntities - Currently selected entities for the game
 * @param {Function} props.onEntitiesChange - Callback when entities change
 */
export default function PlayerSelector({ selectedEntities, onEntitiesChange }) {
  const [savedPlayers, setSavedPlayers] = useState(() => getAllPlayers());
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamPlayer1, setTeamPlayer1] = useState('');
  const [teamPlayer2, setTeamPlayer2] = useState('');
  const [teamName, setTeamName] = useState('');
  const fileInputRef = useRef(null);

  // Sync from server on mount (picks up players added on other devices)
  useEffect(() => {
    syncPlayersFromServer().then((merged) => {
      setSavedPlayers(merged);
    });
  }, []);

  const refreshPlayers = () => {
    setSavedPlayers(getAllPlayers());
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const player = savePlayer(newPlayerName.trim(), newPlayerPhoto);
    setNewPlayerName('');
    setNewPlayerPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    refreshPlayers();

    // Auto-add to game
    const entity = {
      id: `player-${player.id}`,
      type: 'player',
      name: player.name,
      players: [player],
    };
    onEntitiesChange([...selectedEntities, entity]);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        setNewPlayerPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePlayer = (playerId) => {
    deletePlayer(playerId);
    refreshPlayers();
    // Also remove from selected entities
    onEntitiesChange(
      selectedEntities.filter(
        (e) => !e.players.some((p) => p.id === playerId)
      )
    );
  };

  const handleTogglePlayer = (player) => {
    const entityId = `player-${player.id}`;
    const exists = selectedEntities.find((e) => e.id === entityId);
    if (exists) {
      onEntitiesChange(selectedEntities.filter((e) => e.id !== entityId));
    } else {
      const entity = {
        id: entityId,
        type: 'player',
        name: player.name,
        players: [player],
      };
      onEntitiesChange([...selectedEntities, entity]);
    }
  };

  const isPlayerSelected = (playerId) => {
    return selectedEntities.some(
      (e) => e.id === `player-${playerId}`
    );
  };

  const isPlayerInTeam = (playerId) => {
    return selectedEntities.some(
      (e) => e.type === 'team' && e.players.some((p) => p.id === playerId)
    );
  };

  const handleCreateTeam = () => {
    if (!teamPlayer1 || !teamPlayer2 || teamPlayer1 === teamPlayer2) return;
    const p1 = savedPlayers.find((p) => p.id === teamPlayer1);
    const p2 = savedPlayers.find((p) => p.id === teamPlayer2);
    if (!p1 || !p2) return;

    const name = teamName.trim() || `${p1.name} & ${p2.name}`;
    const entity = {
      id: `team-${p1.id}-${p2.id}`,
      type: 'team',
      name,
      players: [p1, p2],
    };

    // Remove individual selections of these players
    const filtered = selectedEntities.filter(
      (e) => e.id !== `player-${p1.id}` && e.id !== `player-${p2.id}`
    );

    onEntitiesChange([...filtered, entity]);
    setShowTeamForm(false);
    setTeamPlayer1('');
    setTeamPlayer2('');
    setTeamName('');
  };

  const handleRemoveEntity = (entityId) => {
    onEntitiesChange(selectedEntities.filter((e) => e.id !== entityId));
  };

  const handleMoveEntity = (index, direction) => {
    const newEntities = [...selectedEntities];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newEntities.length) return;
    [newEntities[index], newEntities[newIndex]] = [newEntities[newIndex], newEntities[index]];
    onEntitiesChange(newEntities);
  };

  const availableForTeam = savedPlayers.filter(
    (p) => !isPlayerInTeam(p.id)
  );

  return (
    <div className={styles.selector}>
      {/* Saved Players */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Jucători Salvați
          <span className={styles.sectionCount}>{savedPlayers.length}</span>
        </div>

        {savedPlayers.length > 0 ? (
          <div className={styles.playerGrid}>
            {savedPlayers.map((player) => {
              const selected = isPlayerSelected(player.id);
              const inTeam = isPlayerInTeam(player.id);
              return (
                <div
                  key={player.id}
                  className={`${styles.playerChip} ${selected ? styles.playerChipSelected : ''}`}
                  onClick={() => !inTeam && handleTogglePlayer(player)}
                  style={{ opacity: inTeam ? 0.5 : 1, cursor: inTeam ? 'default' : 'pointer' }}
                >
                  {player.photo ? (
                    <img className={styles.chipAvatar} src={player.photo} alt={player.name} />
                  ) : (
                    <div
                      className={styles.chipAvatarPlaceholder}
                      style={{ background: getColorForName(player.name) }}
                    >
                      {getInitials(player.name)}
                    </div>
                  )}
                  <span className={styles.chipName}>{player.name}</span>
                  {selected && <span className={styles.chipCheck}>✓</span>}
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlayer(player.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            Niciun jucător salvat. Adaugă primul jucător mai jos.
          </div>
        )}

        {/* Add new player form */}
        <form className={styles.addForm} onSubmit={handleAddPlayer}>
          <div className={styles.photoUpload}>
            <label className={styles.photoUploadLabel}>
              {newPlayerPhoto ? (
                <img className={styles.photoPreview} src={newPlayerPhoto} alt="Preview" />
              ) : (
                '📷'
              )}
              <input
                ref={fileInputRef}
                className={styles.photoUploadInput}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <input
            className={`input ${styles.addInput}`}
            type="text"
            placeholder="Nume jucător nou..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!newPlayerName.trim()}>
            + Adaugă
          </button>
        </form>
      </div>

      {/* Team Creation */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Echipe</div>
        {!showTeamForm ? (
          <button
            className="btn btn-secondary"
            onClick={() => setShowTeamForm(true)}
            disabled={availableForTeam.length < 2}
          >
            👥 Creează Echipă
          </button>
        ) : (
          <div className={styles.teamForm}>
            <div className={styles.teamFormTitle}>Echipă nouă</div>
            <input
              className={`input ${styles.teamNameInput}`}
              type="text"
              placeholder="Nume echipă (opțional)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <div className={styles.teamFormRow}>
              <select
                className={styles.teamFormSelect}
                value={teamPlayer1}
                onChange={(e) => setTeamPlayer1(e.target.value)}
              >
                <option value="">Jucător 1...</option>
                {availableForTeam
                  .filter((p) => p.id !== teamPlayer2)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <span style={{ color: 'var(--text-muted)' }}>&</span>
              <select
                className={styles.teamFormSelect}
                value={teamPlayer2}
                onChange={(e) => setTeamPlayer2(e.target.value)}
              >
                <option value="">Jucător 2...</option>
                {availableForTeam
                  .filter((p) => p.id !== teamPlayer1)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className={styles.teamFormActions}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowTeamForm(false);
                  setTeamPlayer1('');
                  setTeamPlayer2('');
                  setTeamName('');
                }}
              >
                Anulează
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreateTeam}
                disabled={!teamPlayer1 || !teamPlayer2 || teamPlayer1 === teamPlayer2}
              >
                Creează Echipa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Entities for Game */}
      {selectedEntities.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Ordine Joc (Dealer rotativ)
            <span className={styles.sectionCount}>{selectedEntities.length}</span>
          </div>

          <div className={styles.selectedList}>
            {selectedEntities.map((entity, i) => (
              <div key={entity.id} className={styles.selectedItem}>
                <span className={styles.selectedOrder}>{i + 1}</span>
                <div className={styles.selectedInfo}>
                  <div className={styles.selectedName}>{entity.name}</div>
                  <div className={styles.selectedType}>
                    {entity.type === 'team'
                      ? `Echipă: ${entity.players.map((p) => p.name).join(' & ')}`
                      : 'Jucător'}
                  </div>
                </div>
                <div className={styles.selectedActions}>
                  <button
                    className={styles.moveBtn}
                    onClick={() => handleMoveEntity(i, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    className={styles.moveBtn}
                    onClick={() => handleMoveEntity(i, 1)}
                    disabled={i === selectedEntities.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveEntity(entity.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

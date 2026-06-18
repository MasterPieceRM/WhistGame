/**
 * Player Store
 * Persistent player management using localStorage.
 * Players are saved permanently and can be reused across games.
 */

const STORAGE_KEY = 'whist_players';

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Get all saved players from localStorage.
 * @returns {Array<{id: string, name: string, photo: string|null, createdAt: string}>}
 */
export function getAllPlayers() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new player to localStorage.
 * @param {string} name - Player name
 * @param {string|null} photo - Base64 encoded photo or null
 * @returns {Object} The saved player object
 */
export function savePlayer(name, photo = null) {
  const players = getAllPlayers();
  const player = {
    id: generateId(),
    name: name.trim(),
    photo,
    createdAt: new Date().toISOString(),
  };
  players.push(player);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  return player;
}

/**
 * Update an existing player.
 * @param {string} id - Player ID
 * @param {Object} updates - Fields to update (name, photo)
 * @returns {Object|null} Updated player or null if not found
 */
export function updatePlayer(id, updates) {
  const players = getAllPlayers();
  const index = players.findIndex((p) => p.id === id);
  if (index === -1) return null;
  players[index] = { ...players[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  return players[index];
}

/**
 * Delete a player from localStorage.
 * @param {string} id - Player ID
 * @returns {boolean} Whether the player was found and deleted
 */
export function deletePlayer(id) {
  const players = getAllPlayers();
  const filtered = players.filter((p) => p.id !== id);
  if (filtered.length === players.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get a player by ID.
 * @param {string} id - Player ID
 * @returns {Object|null} Player object or null
 */
export function getPlayerById(id) {
  return getAllPlayers().find((p) => p.id === id) || null;
}

// ===== Game State Persistence =====

const GAME_STATE_KEY = 'whist_current_game';

/**
 * Save the current game state.
 * @param {Object} gameState - The full game state to persist
 */
export function saveGameState(gameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  } catch {
    // localStorage might be full
  }
}

/**
 * Load saved game state.
 * @returns {Object|null} Saved game state or null
 */
export function loadGameState() {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(GAME_STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Clear saved game state.
 */
export function clearGameState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GAME_STATE_KEY);
}

// ===== Game History =====

const GAME_HISTORY_KEY = 'whist_game_history';

/**
 * Save a finished game to the history log (newest first, max 30 entries).
 * @param {{ id: string, finishedAt: string, entities: Array, totalScores: number[], rounds: number, partial?: boolean }} entry
 */
export function saveGameToHistory(entry) {
  if (typeof window === 'undefined') return;
  try {
    const history = loadGameHistory();
    history.unshift(entry);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  } catch { }
}

/**
 * Load the full game history.
 * @returns {Array}
 */
export function loadGameHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(GAME_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

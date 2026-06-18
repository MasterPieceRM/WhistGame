/**
 * Player Store
 * Persistent player management using localStorage + Vercel KV sync.
 * localStorage = instant UI. Server = cross-device persistence.
 */

const STORAGE_KEY = 'whist_players';

// ===== Server Sync Helpers =====

function postToServer(path, body) {
  if (typeof window === 'undefined') return;
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => { });
}

/**
 * Pull players from the server and merge into localStorage (server wins).
 * Returns the merged list.
 */
export async function syncPlayersFromServer() {
  if (typeof window === 'undefined') return getAllPlayers();
  try {
    const res = await fetch('/api/players');
    if (!res.ok) return getAllPlayers();
    const serverPlayers = await res.json();
    if (Array.isArray(serverPlayers) && serverPlayers.length > 0) {
      // Merge: server list is authoritative; add any local-only entries not on server
      const serverIds = new Set(serverPlayers.map((p) => p.id));
      const localOnly = getAllPlayers().filter((p) => !serverIds.has(p.id));
      const merged = [...serverPlayers, ...localOnly];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (localOnly.length > 0) postToServer('/api/players', merged);
      return merged;
    }
    // Server has no players yet — push local players up
    const local = getAllPlayers();
    if (local.length > 0) postToServer('/api/players', local);
    return local;
  } catch {
    return getAllPlayers();
  }
}

/**
 * Pull history from server and overwrite localStorage.
 */
export async function syncHistoryFromServer() {
  if (typeof window === 'undefined') return loadGameHistory();
  try {
    const res = await fetch('/api/history');
    if (!res.ok) return loadGameHistory();
    const serverHistory = await res.json();
    if (Array.isArray(serverHistory) && serverHistory.length > 0) {
      localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(serverHistory));
      return serverHistory;
    }
    return loadGameHistory();
  } catch {
    return loadGameHistory();
  }
}

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
  postToServer('/api/players', players);
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
  postToServer('/api/players', players);
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
  postToServer('/api/players', filtered);
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
    const trimmed = history.slice(0, 30);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(trimmed));
    postToServer('/api/history', entry);
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

/**
 * Whist Game Logic
 * Handles round generation, scoring, dealer/starter rotation, and consecutive tracking.
 */

/**
 * Generate the full sequence of rounds for a Whist game.
 * 5×1, 2-7, 5×8, 7-2, 5×1 = 27 rounds total
 * @returns {number[]} Array of card counts per round
 */
export function generateRoundSequence() {
  const rounds = [];
  // 5 rounds of 1 card
  for (let i = 0; i < 5; i++) rounds.push(1);
  // Ascending: 2 to 7
  for (let i = 2; i <= 7; i++) rounds.push(i);
  // 5 rounds of 8 cards
  for (let i = 0; i < 5; i++) rounds.push(8);
  // Descending: 7 to 2
  for (let i = 7; i >= 2; i--) rounds.push(i);
  // 5 rounds of 1 card
  for (let i = 0; i < 5; i++) rounds.push(1);
  return rounds;
}

/**
 * Get the dealer index for a given round.
 * Rotates through entities.
 * @param {number} roundIndex - 0-based round index
 * @param {number} entityCount - number of entities (players/teams)
 * @returns {number} Index of the dealer
 */
export function getDealerIndex(roundIndex, entityCount) {
  return roundIndex % entityCount;
}

/**
 * Get the starter index (the one to the right of the dealer).
 * @param {number} dealerIndex - index of the dealer
 * @param {number} entityCount - number of entities
 * @returns {number} Index of the starter
 */
export function getStarterIndex(dealerIndex, entityCount) {
  return (dealerIndex + 1) % entityCount;
}

/**
 * Calculate score for a single round for one entity.
 * Win (correct bet): +5 + bet
 * Loss (wrong bet): -(5 + |taken - bet|)
 * @param {number} bet - number of hands bet
 * @param {number} taken - number of hands actually taken
 * @returns {{ score: number, won: boolean, error: number }}
 */
export function calculateRoundScore(bet, taken) {
  if (bet === taken) {
    return {
      score: 5 + bet,
      won: true,
      error: 0,
    };
  } else {
    const error = Math.abs(taken - bet);
    return {
      score: -(5 + error),
      won: false,
      error,
    };
  }
}

/**
 * Calculate consecutive bonus/penalty.
 * At 5 consecutive wins: +10 bonus, reset counter.
 * At 5 consecutive losses: -10 penalty, reset counter.
 * @param {number} consecutiveCount - current consecutive count (positive = wins, negative = losses)
 * @param {boolean} won - whether current round was won
 * @returns {{ newConsecutive: number, bonus: number }}
 */
export function calculateConsecutiveBonus(consecutiveCount, won) {
  let newConsecutive;

  if (won) {
    // If was on a losing streak, reset to 1
    newConsecutive = consecutiveCount >= 0 ? consecutiveCount + 1 : 1;
  } else {
    // If was on a winning streak, reset to -1
    newConsecutive = consecutiveCount <= 0 ? consecutiveCount - 1 : -1;
  }

  let bonus = 0;
  if (newConsecutive === 5) {
    bonus = 10;
    newConsecutive = 0;
  } else if (newConsecutive === -5) {
    bonus = -10;
    newConsecutive = 0;
  }

  return { newConsecutive, bonus };
}

/**
 * Process an entire round's results for all entities.
 * @param {Array<{bet: number, taken: number}>} results - bet and taken for each entity
 * @param {number[]} previousConsecutives - consecutive counts for each entity
 * @returns {Array<{score: number, bonus: number, total: number, won: boolean, error: number, newConsecutive: number}>}
 */
export function processRoundResults(results, previousConsecutives) {
  return results.map((result, index) => {
    const { score, won, error } = calculateRoundScore(result.bet, result.taken);
    const { newConsecutive, bonus } = calculateConsecutiveBonus(
      previousConsecutives[index],
      won
    );
    return {
      score,
      bonus,
      total: score + bonus,
      won,
      error,
      newConsecutive,
      bet: result.bet,
      taken: result.taken,
    };
  });
}

/**
 * Calculate cumulative scores from game history.
 * @param {Array<Array<{total: number}>>} roundsHistory - array of round results per entity
 * @returns {number[]} Cumulative scores per entity
 */
export function getCumulativeScores(roundsHistory) {
  if (roundsHistory.length === 0) return [];
  const entityCount = roundsHistory[0].length;
  const scores = new Array(entityCount).fill(0);
  for (const round of roundsHistory) {
    for (let i = 0; i < entityCount; i++) {
      scores[i] += round[i].total;
    }
  }
  return scores;
}

/**
 * Get cumulative scores up to each round.
 * @param {Array<Array<{total: number}>>} roundsHistory
 * @returns {number[][]} cumulative scores at each round for each entity
 */
export function getCumulativeScoresPerRound(roundsHistory) {
  if (roundsHistory.length === 0) return [];
  const entityCount = roundsHistory[0].length;
  const running = new Array(entityCount).fill(0);
  return roundsHistory.map((round) => {
    return round.map((result, i) => {
      running[i] += result.total;
      return running[i];
    });
  });
}

/**
 * Determine the winner(s) - entities with the highest score.
 * @param {number[]} scores - final scores
 * @param {Array} entities - entity objects
 * @returns {Array} winning entities
 */
export function getWinners(scores, entities) {
  const maxScore = Math.max(...scores);
  return entities.filter((_, index) => scores[index] === maxScore);
}

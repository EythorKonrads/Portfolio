// The shared scoreboard's rules: an arcade-style top 10 of 2–3 initials.
// Used by both the end screen and the function that stores the board
// (netlify/functions/scores/), so the two always agree.
import {
  ASTEROIDS,
  FIRST_SPAWN,
  SPLIT_COUNT,
  SPLITS_INTO,
  WAVE_BONUS,
} from './config';
import { waveAsteroids } from './game';

export const BOARD_SIZE = 10;
// A–Z only, so there's nothing to moderate
export const INITIALS = /^[A-Z]{2,3}$/;
const MAX_WAVE = 1000;

// The most Score one Asteroid can give: its own, plus all its pieces'
function rockScore(size) {
  const smaller = SPLITS_INTO[size];
  return (
    ASTEROIDS[size].score + (smaller ? SPLIT_COUNT * rockScore(smaller) : 0)
  );
}

// The most Score a game that reached `wave` could have: every Asteroid of
// every Wave so far destroyed, plus the bonus for each Wave survived
export function maxScore(wave) {
  let total = 0;
  for (let w = 1; w <= wave; w++) {
    total += waveAsteroids(w).reduce((sum, size) => sum + rockScore(size), 0);
    if (w < wave) total += WAVE_BONUS * w;
  }
  return total;
}

// Why an entry can't go on the board, or null if it can. Some cheating gets
// through; impossible scores don't.
export function entryProblem({ initials, score, wave, time }) {
  if (typeof initials !== 'string' || !INITIALS.test(initials)) {
    return 'initials';
  }
  if (!Number.isInteger(wave) || wave < 1 || wave > MAX_WAVE) return 'wave';
  if (!Number.isInteger(score) || score < 1 || score > maxScore(wave)) {
    return 'score';
  }
  // No Asteroid arrives before FIRST_SPAWN, so no Wave is over sooner
  if (typeof time !== 'number' || !(time >= (wave - 1) * FIRST_SPAWN)) {
    return 'time';
  }
  return null;
}

// Highest Score first; on a tie, whoever got there first
const byRank = (a, b) => b.score - a.score || a.date.localeCompare(b.date);

export function qualifies(board, score) {
  return (
    score > 0 &&
    (board.length < BOARD_SIZE || score > board[board.length - 1].score)
  );
}

// The board with an entry added, and the entry's place on it (1 is the
// top), or 0 if it didn't make it
export function addToBoard(board, entry) {
  const next = [...board, entry].sort(byRank).slice(0, BOARD_SIZE);
  return { board: next, rank: next.indexOf(entry) + 1 };
}

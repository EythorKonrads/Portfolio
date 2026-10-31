// The scoreboard API, apart from where it's stored, so tests can give it an
// in-memory store. See docs/scoreboard.md for the data and how to export it.
//
//   GET  /api/scores  ->  { board }
//   POST /api/scores  { initials, score, wave, time }  ->  { board, rank }
//
// Every entry that makes the board is kept for good under entries/, and
// `board` holds the current top 10. Two saves at the same moment can both
// rewrite `board` and one of them drop off it, but both stay in entries/,
// from which the board can be rebuilt.
import {
  addToBoard,
  entryProblem,
  qualifies,
} from '../../../src/game/scoreboard.js';

const MAX_BODY = 500; // bytes; a real entry is well under 100

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function handleScores(request, store) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'method' }, 405);
  }
  const board = (await store.get('board', { type: 'json' })) ?? [];
  if (request.method === 'GET') return json({ board });

  // Cheap checks first, so junk costs as little as possible
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'size' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'json' }, 400);
  }
  const { initials, score, wave, time } = body ?? {};
  const problem = entryProblem({ initials, score, wave, time });
  if (problem) return json({ error: problem }, 422);
  // Only scores that make the board are written
  if (!qualifies(board, score)) return json({ board, rank: 0 });

  const entry = {
    initials,
    score,
    wave,
    time: Math.round(time),
    date: new Date().toISOString(),
  };
  const id = `${entry.date}-${crypto.randomUUID().slice(0, 8)}`;
  await store.setJSON(`entries/${id}`, entry);
  const { board: next, rank } = addToBoard(board, entry);
  await store.setJSON('board', next);
  return json({ board: next, rank });
}

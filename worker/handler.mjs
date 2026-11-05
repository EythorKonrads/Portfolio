// The Scoreboard API, apart from where it's stored, so tests can give it an
// in-memory store. See docs/scoreboard.md for the data.
//
//   GET  /api/scores  ->  { board }
//   POST /api/scores  { initials, score, wave, time }  ->  { board, rank }
//
// `store` needs board(), the current top 10, and add(id, entry).
import { addToBoard, entryProblem, qualifies } from '../src/game/scoreboard.js';

const MAX_BODY = 500; // bytes; a real entry is well under 100

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function handleScores(request, store) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'method' }, 405);
  }
  const board = await store.board();
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
  await store.add(`${entry.date}-${crypto.randomUUID().slice(0, 8)}`, entry);
  const { board: next, rank } = addToBoard(board, entry);
  return json({ board: next, rank });
}

// Only /api/* reaches this Worker (wrangler.jsonc); Cloudflare serves the site
// itself as static files, so using up the Worker's limits can't touch the page.
import { BOARD_SIZE } from '../src/game/scoreboard.js';
import { handleScores } from './handler.mjs';

const d1Store = (db) => ({
  board: async () => {
    // Same order as byRank in src/game/scoreboard.js
    const { results } = await db
      .prepare(
        `SELECT initials, score, wave, time, date FROM entries
         ORDER BY score DESC, date ASC LIMIT ?`
      )
      .bind(BOARD_SIZE)
      .all();
    return results;
  },
  add: (id, { initials, score, wave, time, date }) =>
    db
      .prepare(
        `INSERT INTO entries (id, initials, score, wave, time, date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, initials, score, wave, time, date)
      .run(),
});

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/scores') {
      return new Response('Not found', { status: 404 });
    }
    return handleScores(request, d1Store(env.DB));
  },
};

// Only /api/* reaches this Worker (wrangler.jsonc); Cloudflare serves the site
// itself as static files, so using up the Worker's limits can't touch the page.
import about from '../src/assets/about.md';
import educations from '../src/assets/educations.json';
import jobs from '../src/assets/jobs.json';
import languages from '../src/assets/languages.json';
import projects from '../src/assets/projects.json';
import { BOARD_SIZE } from '../src/game/scoreboard.js';
import {
  cleanup,
  handleAsk,
  ipHasher,
  turnstileVerifier,
  unavailable,
} from './ask.mjs';
import { buildSystem, claudeAnswerer } from './claude.mjs';
import { handleScores } from './handler.mjs';

// Built once per isolate; identical on every request so the prompt cache hits
const system = buildSystem({ jobs, educations, projects, languages }, about);

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

const d1AskStore = (db) => ({
  increment: (key, expiresAt) =>
    db
      .prepare(
        `INSERT INTO ask_counters (key, count, expires_at) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`
      )
      .bind(key, expiresAt)
      .first('count'),
  add: ({ id, question, date }) =>
    db
      .prepare(
        'INSERT INTO unanswered_questions (id, question, date) VALUES (?, ?, ?)'
      )
      .bind(id, question, date)
      .run(),
  deleteCounters: (before) =>
    db
      .prepare('DELETE FROM ask_counters WHERE expires_at <= ?')
      .bind(before)
      .run(),
  deleteQuestions: (before) =>
    db
      .prepare('DELETE FROM unanswered_questions WHERE date < ?')
      .bind(before)
      .run(),
});

// PR previews and CI have none of these, so Ask stays off there
const askConfigured = (env) =>
  env.ANTHROPIC_API_KEY &&
  env.TURNSTILE_SECRET_KEY &&
  env.ASK_IP_KEY &&
  env.ASK_DB;

async function ask(request, env) {
  if (!askConfigured(env)) return unavailable();
  const store = d1AskStore(env.ASK_DB);
  return handleAsk(request, {
    counters: store,
    questions: store,
    verifyTurnstile: turnstileVerifier(env.TURNSTILE_SECRET_KEY),
    answer: claudeAnswerer(env.ANTHROPIC_API_KEY, system),
    hmac: await ipHasher(env.ASK_IP_KEY),
    now: () => new Date(),
  });
}

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/scores')
      return handleScores(request, d1Store(env.DB));
    if (pathname === '/api/ask') return ask(request, env);
    return new Response('Not found', { status: 404 });
  },

  // Hourly (wrangler.jsonc): drops Ask's ended counters and old questions
  scheduled(controller, env, ctx) {
    if (!env.ASK_DB) return;
    ctx.waitUntil(cleanup(d1AskStore(env.ASK_DB), new Date()));
  },
};

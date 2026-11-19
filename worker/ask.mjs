// Ask's API, apart from D1, Turnstile and Claude, so tests can give it
// in-memory stores and stubs. See docs/ask.md.
//
//   POST /api/ask  { question, token }  ->  { status, answer }
//
// `deps`:
//   counters.increment(key, expiresAt) -> the key's new count
//   questions.add({ id, question, date }) saves an Unanswered question
//   verifyTurnstile(token) -> true or false; throws if it can't tell
//   answer(question) -> { status, answer }; on failure it throws an error
//     whose `log` is what to log (worker/claude.mjs)
//   hmac(ip) -> the visitor's hash
//   now() -> the current Date

const HOUR_LIMIT = 20; // questions per visitor per UTC clock hour
const DAY_LIMIT = 100; // questions for the whole site per UTC day
const MAX_QUESTION = 300; // characters
const MAX_BODY = 8000; // characters; a question and a Turnstile token fit
const KEEP_DAYS = 90; // how long Unanswered questions are kept

export const UNKNOWN_TEXT =
  "I don't know that one. Ask Eythor directly at hello@eythorkonrads.com.";
const OFF_TOPIC_TEXT = 'I only answer questions about Eythor and his work.';

const headers = { 'Cache-Control': 'no-store' };
const json = (body, status = 200) => Response.json(body, { status, headers });
export const unavailable = () => json({ error: 'unavailable' }, 503);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const nextHour = (now) =>
  new Date(Math.floor(now.getTime() / HOUR) * HOUR + HOUR);
const nextMidnight = (now) =>
  new Date(Math.floor(now.getTime() / DAY) * DAY + DAY);
const day = (date) => date.toISOString().slice(0, 10);

export async function handleAsk(request, deps) {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: 'POST' },
    });
  }

  // Cheap checks first, so junk costs as little as possible
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'size' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'json' }, 400);
  }
  const { question, token } = body ?? {};
  const trimmed = typeof question === 'string' ? question.trim() : '';
  if (!trimmed || trimmed.length > MAX_QUESTION) {
    return json({ error: 'length' }, 422);
  }

  let human;
  try {
    human = typeof token === 'string' && (await deps.verifyTurnstile(token));
  } catch {
    console.error({ ask: 'turnstile' });
    return unavailable();
  }
  if (!human) return json({ error: 'turnstile' }, 403);

  // The visitor counter goes first, so one visitor over their limit can't
  // use up the site's day
  const now = deps.now();
  const hourEnd = nextHour(now).toISOString();
  const dayEnd = nextMidnight(now).toISOString();
  try {
    const visitor = await deps.hmac(request.headers.get('CF-Connecting-IP'));
    const hour = now.toISOString().slice(0, 13);
    const asked = await deps.counters.increment(
      `visitor:${visitor}:${hour}`,
      hourEnd
    );
    if (asked > HOUR_LIMIT) {
      return json({ error: 'hourLimit', retryAt: hourEnd }, 429);
    }
    const siteAsked = await deps.counters.increment(`site:${day(now)}`, dayEnd);
    if (siteAsked > DAY_LIMIT) {
      return json({ error: 'dayLimit', retryAt: dayEnd }, 429);
    }
  } catch {
    console.error({ ask: 'd1', step: 'counter' });
    return unavailable();
  }

  let reply;
  try {
    reply = await deps.answer(trimmed);
  } catch (error) {
    console.error(error?.log ?? { ask: 'claude' });
    return unavailable();
  }

  if (reply.status === 'offTopic') {
    return json({ status: 'offTopic', answer: OFF_TOPIC_TEXT });
  }
  if (reply.status === 'unknown') {
    try {
      await deps.questions.add({
        id: crypto.randomUUID(),
        question: trimmed,
        date: day(now),
      });
    } catch {
      // The visitor still gets their answer
      console.error({ ask: 'd1', step: 'save' });
    }
    return json({ status: 'unknown', answer: UNKNOWN_TEXT });
  }
  return json({ status: 'answered', answer: reply.answer });
}

// The hourly Cron Trigger. `store` needs deleteCounters(before), for
// counters whose hour or day ended by then, and deleteQuestions(before), for
// Unanswered questions dated before that day.
export async function cleanup(store, now) {
  await store.deleteCounters(now.toISOString());
  await store.deleteQuestions(day(new Date(now.getTime() - KEEP_DAYS * DAY)));
}

// The visitor's key: the IP itself is never stored or logged
export async function ipHasher(secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return async (ip) => {
    const mac = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(ip ?? '')
    );
    return [...new Uint8Array(mac)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// Throws when siteverify can't be reached, times out or doesn't reply with
// JSON, so Ask fails closed
export const turnstileVerifier =
  (secret, fetcher = fetch) =>
  async (token) => {
    const response = await fetcher(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) throw new Error('siteverify');
    const { success } = await response.json();
    if (typeof success !== 'boolean') throw new Error('siteverify');
    return success;
  };

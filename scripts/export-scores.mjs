// Prints every saved scoreboard entry as JSON Lines (one JSON object per
// line), for a backup or a move off Netlify. See docs/scoreboard.md.
//
//   NETLIFY_SITE_ID=… NETLIFY_AUTH_TOKEN=… npm run --silent export:scores > scores.jsonl
import { getStore } from '@netlify/blobs';

const { NETLIFY_SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
if (!siteID || !token) {
  console.error('Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN first.');
  process.exit(1);
}

const store = getStore({ name: 'scores', siteID, token });
// list() follows every page of results by itself
const { blobs } = await store.list({ prefix: 'entries/' });
for (const { key } of blobs) {
  const entry = await store.get(key, { type: 'json' });
  const id = key.slice('entries/'.length);
  process.stdout.write(`${JSON.stringify({ id, ...entry })}\n`);
}
console.error(`Exported ${blobs.length} entries.`);

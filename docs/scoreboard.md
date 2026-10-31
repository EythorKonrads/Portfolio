# Scoreboard

The game's shared, arcade-style top 10: three initials (A–Z) and a Score.
Designed in issue #37; why it runs on Netlify Blobs for now is in
`docs/adr/0003-scoreboard-on-netlify-blobs-for-now.md`.

## Where things are

- `src/game/scoreboard.js`: the rules, shared by the game and the server. It
  covers valid initials, the highest Score a Wave could give, the minimum
  time to reach a Wave, and ranking.
- `netlify/functions/scores/handler.mjs`: the API, `/api/scores`.
  - `GET` returns `{ board }`.
  - `POST { initials, score, wave, time }` returns `{ board, rank }`, with
    `rank` 0 if the Score didn't make the board.
- `netlify/functions/scores/scores.mjs`: connects that API to Netlify Blobs.
- `src/components/GameEnd.vue`: shows the board, and asks for initials when a
  Score makes it.

`npm run dev` has no functions, so the end screen says the scoreboard isn't
available. To try it locally, run the site with the Netlify CLI
(`netlify dev`).

## The data

Everything is in the Netlify Blobs store `scores`:

- `entries/<date>-<id>`: one per Score that made the board, kept for good
  even after it drops off:
  `{ "initials": "ABC", "score": 1234, "wave": 7, "time": 312, "date": "2026-10-31T16:00:00.000Z" }`
  (`time` is seconds played).
- `board`: the current top 10, the same entries as an array, best first.

`board` can always be rebuilt from `entries/`: sort by `score`, highest
first, then by `date`, earliest first, and keep 10.

## Exporting

```sh
NETLIFY_SITE_ID=… NETLIFY_AUTH_TOKEN=… npm run --silent export:scores > scores.jsonl
```

This prints every entry as JSON Lines, one object per line, with its `id`
added. The site ID is under Site configuration in Netlify. The token is a
personal access token from User settings → Applications.

## Moving to AWS

1. Export as above, just before switching over, so no entry is missed.
2. Load `scores.jsonl` into the new database. Each line is one row, keyed by
   `id`.
3. Swap the storage under the handler. `handleScores(request, store)` only
   needs `get(key, { type: 'json' })` and `setJSON(key, value)`.
4. Rebuild `board` from the loaded entries.

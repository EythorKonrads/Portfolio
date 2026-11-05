# Scoreboard

The game's shared, arcade-style top 10: initials (2 or 3 letters, A–Z) and a Score.
Designed in issue #37, which had exactly three initials; 2 or 3 are allowed
so two-letter initials fit. Why it runs on Cloudflare is in
`docs/adr/0004-move-to-cloudflare.md`.

## Where things are

- `src/game/scoreboard.js`: the rules, shared by the game and the server. It
  covers valid initials, the highest Score a Wave could give, the minimum
  time to reach a Wave, and ranking.
- `worker/handler.mjs`: the API, `/api/scores`.
  - `GET` returns `{ board }`.
  - `POST { initials, score, wave, time }` returns `{ board, rank }`, with
    `rank` 0 if the Score didn't make the board.
- `worker/index.mjs`: connects that API to D1.
- `migrations/`: the database's tables.
- `src/components/GameEnd.vue`: shows the board, and asks for initials when a
  Score makes it.

`npm run dev` alone has no API, so the end screen says the scoreboard isn't
available. To try it locally, Vite passes `/api` on to `wrangler dev`, which
uses a local database:

```sh
npx vite build     # wrangler dev needs dist/ to exist
npx wrangler d1 migrations apply portfolio-scores --local
npx wrangler dev   # leave running, and run npm run dev in another terminal
```

## The data

Everything is in the D1 database `portfolio-scores`. PR previews run as a
separate Worker, `portfolio-preview`, with its own database,
`portfolio-scores-preview`, so testing there doesn't put scores on the real
board.

The `entries` table has one row per Score that made the board, kept for good
even after it drops off: `id`, `initials`, `score`, `wave`, `time` (seconds
played) and `date`.

The board is a query: sort by `score`, highest first, then by `date`, earliest
first, and keep 10.

## Exporting

```sh
npx wrangler d1 export portfolio-scores --remote --output=scores.sql
```

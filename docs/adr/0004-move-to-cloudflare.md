# The site and scoreboard move to Cloudflare, not AWS

Netlify's free plan allows about 20 production deploys a month, and running out
of credits pauses the whole site. Issue #37 and ADR-0003 planned a move to AWS
to fix this. We chose Cloudflare instead: static files on a Worker, and the
Scoreboard API on the same Worker, stored in D1. It costs nothing at this
traffic, needs only one account, and has hard limits on its free plan, where
AWS has no spending cap and abuse would grow the bill. The cost is giving up
the AWS experience the move would have added to the portfolio.

## Considered Options

- **Workers KV for the scores:** the smallest code change, as its API nearly
  matches Netlify Blobs. Rejected because writes can take over 60 seconds to
  reach other regions, so a player on a stale `board` could knock someone else
  off it. D1 sends every read and write to one database, and the top 10 becomes
  a query, so there is no separate `board` to get out of step.
- **Cloudinary:** an image and video CDN, not somewhere to keep a scoreboard.

## Consequences

- Only `/api/*` should run the Worker, so that using up the free Worker limit
  affects the Scoreboard and not the page. Cloudflare documents static files as
  free and unlimited, but not exactly what happens at the limit, so this is
  likely rather than proven.
- PR previews are branches of the same Worker, given their own test database
  so test scores stay off the real board.
- The Scoreboard started empty on Cloudflare. The old board held only Eythor's
  own Scores, so they weren't worth carrying over.

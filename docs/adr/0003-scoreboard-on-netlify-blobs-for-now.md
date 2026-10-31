# The scoreboard starts on Netlify Blobs, before the move to AWS

Issue #37 planned the scoreboard for after a move to AWS. On Netlify's free
plan, someone spamming the scoreboard could use up the account's credits,
and Netlify would then pause the whole site. We start on Netlify Blobs anyway,
behind a single function, to get the scoreboard out sooner, and accept that
risk until the move.

To keep the risk and the move small:

- The function does the cheap checks first and only writes when a score makes
  the top 10, so most junk costs one function call and no writes.
- Every entry that makes the board is kept for good, not just the current top
  10, and `npm run export:scores` downloads them all as JSON Lines. Nothing
  needs to be lost in the move (see `docs/scoreboard.md`).
- The rules live in `src/game/scoreboard.js` and the API in a handler that
  doesn't know where it's stored, so only the storage needs replacing on AWS.

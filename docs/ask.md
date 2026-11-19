# Ask

The "Ask about me" box: a visitor types a question about Eythor and gets a
short answer from Claude, written from the site's content and the About file.
The full design is in issue #135; the terms (Ask, Unanswered question,
Off-topic question) are in `GLOSSARY.md`.

## Where things are

- `worker/ask.mjs`: the API, `POST /api/ask` with `{ question, token }`, which
  returns `{ status, answer }` or `{ error }`. It holds the limits (20
  questions per visitor per UTC hour, 100 per day for the whole site, 300
  characters per question), the order of checks, the logging and the hourly
  cleanup, with D1, Turnstile and Claude passed in so the component spec
  (`cypress/component/ask-handler.cy.js`) can replace them.
- `worker/index.mjs`: connects that API to D1, Turnstile siteverify and the
  `ASK_IP_KEY` hash, and runs the cleanup from the hourly Cron Trigger. Ask
  returns 503 when `ANTHROPIC_API_KEY`, `TURNSTILE_SECRET_KEY`, `ASK_IP_KEY`
  or `ASK_DB` is missing, as in PR previews and CI.
- `worker/claude.mjs`: the Claude call. It builds the system prompt (the rules
  for how answers read, then the site's JSON content and the About file) and
  sends one request to the Messages API with plain `fetch`: Claude Haiku 5.5,
  low effort, a JSON schema for `{ status, answer }`, a 20-second timeout and
  no retries. Any failure (timeout, an error status, a reply that isn't JSON or
  doesn't match the schema, or a stop other than `end_turn`) gives 503. Its
  component spec is `cypress/component/ask-claude.cy.js`.
- `src/assets/about.md`: the About file (see below).
- `migrations-ask/`: the database's tables.

## The About file

`src/assets/about.md` tells Ask what the rest of the site doesn't: what Eythor
is looking for, his skills, how he works, life outside work, contact details
and a FAQ. Ask sends it to Claude as written with every question, next to
`src/assets/*.json`, so anything in it can end up in an answer.

- Plain Markdown with `##` sections, about Eythor in the third person.
- No "as of" dates: write it so it stays true, and edit it by hand when it
  doesn't.
- Grow the FAQ from Unanswered questions (below): add the question in bold and
  a short answer under it.
- Never put in it: salary, home address, phone number, or family details beyond
  a mention. Questions about them stay Unanswered questions.

A change to it changes the prompt, so the first question after a deploy writes
the prompt cache again. CI skips PRs that only change `.md` files, which is
fine for this file.

## Running it locally

`npm run dev` alone has no API. Vite passes `/api` on to `wrangler dev`, which
uses a local `portfolio-ask` database. Put the secrets in `.dev.vars` (ignored
by git), with Cloudflare's always-pass Turnstile test secret:

```sh
ANTHROPIC_API_KEY=<a key>
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ASK_IP_KEY=local
```

Then:

```sh
npx vite build     # wrangler dev needs dist/ to exist
npx wrangler d1 migrations apply portfolio-ask --local
npx wrangler dev   # leave running, and run npm run dev in another terminal
```

`npx wrangler dev --test-scheduled` also lets you run the cleanup by opening
`http://localhost:8787/cdn-cgi/handler/scheduled`.

## The data

Everything is in the D1 database `portfolio-ask`, in the EU jurisdiction. PR
previews have no Ask database, so Ask is off there.

- `ask_counters`: one row per visitor per UTC hour
  (`visitor:<hash>:<YYYY-MM-DDTHH>`) and one per UTC day (`site:<YYYY-MM-DD>`),
  with the count and when it ends. The visitor hash is an HMAC of the IP with
  `ASK_IP_KEY`; the IP itself is never stored or logged.
- `unanswered_questions`: each question Ask couldn't answer, with only its UTC
  date, kept 90 days. Answered and Off-topic questions are never stored.

The hourly cleanup deletes counters that have ended and Unanswered questions
older than 90 days.

## Reading Unanswered questions

To fill in the About file:

```sh
npx wrangler d1 execute portfolio-ask --remote \
  --command "SELECT date, question FROM unanswered_questions ORDER BY date DESC"
```

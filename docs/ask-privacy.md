# Privacy: record of processing

The site's record of processing under GDPR Art. 30, and the queries for
deleting one person's data on request. The visitor-facing notice is the
`/privacy` page (`src/views/PrivacyView.vue`); this file is the record behind
it, and the two should change together.

This is not legal advice. It is based on a non-lawyer's reading of the primary
sources, collected in `docs/research/ask-gdpr.md` on the `research/ask-gdpr`
branch
([link](https://github.com/EythorKonrads/Portfolio/blob/research/ask-gdpr/docs/research/ask-gdpr.md)).

## Controller

Eythor Konradsson, Denmark, hello@eythorkonrads.com. No data protection
officer is needed (Art. 37). The supervisory authority is Datatilsynet.

## Processors

- **Cloudflare** hosts the site and runs the Worker, the D1 databases and
  Turnstile. Its DPA is part of the Self-Serve Subscription Agreement. Data
  goes to the US under the EU-US Data Privacy Framework, with Standard
  Contractual Clauses as the fallback. For Turnstile, Cloudflare is also a
  controller of the signals it uses to improve its own bot detection.
- **Anthropic** (Anthropic Ireland, Limited) answers Ask's questions with
  Claude. Its DPA is part of the Commercial Terms, and Anthropic may not train
  models on the questions. Data is processed in the US under Standard
  Contractual Clauses; there is no EU option.

## Purposes

Every purpose below rests on legitimate interests (Art. 6(1)(f)). Visitors are
told about each one on the `/privacy` page, and Ask's two-line note links to
it before a question is sent.

### Answering questions

- **Interest:** answering a question the visitor chose to ask.
- **Data:** the question text, sent from the Worker to Anthropic. The site
  doesn't store answered questions or Off-topic questions.
- **Recipients:** Cloudflare (the Worker) and Anthropic.
- **Retention:** Anthropic keeps inputs and outputs for up to 30 days, or
  longer if they are flagged under its Usage Policy.

### Rate limiting with a keyed IP hash

- **Interest:** protecting Ask from abuse and from a runaway API bill.
- **Data:** an HMAC-SHA-256 of `CF-Connecting-IP`, with the Worker secret
  `ASK_IP_KEY` as the key. It is stored in `ask_counters` in `portfolio-ask`
  under keys like `visitor:<hash>:<YYYY-MM-DDTHH>`, together with a count. A
  site-wide `site:<YYYY-MM-DD>` counter holds no personal data.
- **Recipients:** Cloudflare.
- **Retention:** one hour. The hourly Cron Trigger deletes rows that have
  ended.

### Keeping Unanswered questions

- **Interest:** finding out what visitors want to know, to improve the About
  file.
- **Data:** the question text and its UTC date only, in `unanswered_questions`
  in `portfolio-ask`, with no IP or hash. Free text can name the visitor or
  someone else, so the whole table counts as personal data.
- **Recipients:** Cloudflare. The questions are never published.
- **Retention:** 90 days. The hourly Cron Trigger deletes older rows.

### Turnstile bot check

- **Interest:** keeping bots from using Ask.
- **Data:** the browser signals Turnstile collects when a question is sent,
  such as the IP address, TLS fingerprint and User-Agent. Turnstile runs only
  on submit, never on page load, and sets no cookie because Ask doesn't use
  pre-clearance. The site keeps only the pass or fail result for that request.
- **Recipients:** Cloudflare, as processor, and as controller for improving
  its bot detection (see its Turnstile privacy addendum).
- **Retention:** the site keeps nothing. Cloudflare's addendum sets its own
  retention.

### The Scoreboard

- **Interest:** running the game's public top 10.
- **Data:** the initials a player enters (2 or 3 letters), with the score,
  wave, time played and date, in `entries` in `portfolio-scores`.
- **Recipients:** Cloudflare, and anyone who views the board, since the top 10
  is public.
- **Retention:** kept for good, including entries that have dropped off the
  board.

### Browser storage

- **Interest:** remembering the visitor's theme, and their Ask history for the
  rest of the visit.
- **Data:** the light or dark choice in `localStorage` (key `theme`), and the
  Ask questions and answers in `sessionStorage`. Neither one leaves the device.
- **Recipients:** none.
- **Retention:** the theme stays until the visitor clears site data. The Ask
  history lasts until the tab closes or the visitor presses Clear chat.

## Safeguards

- `portfolio-ask` was created in the EU jurisdiction.
- The IP hash is an HMAC with a secret key, not a plain hash, and the raw IP is
  never stored.
- Invocation logs are off (`observability.logs.invocation_logs: false` in
  `wrangler.jsonc`), so request headers, `CF-Connecting-IP` among them, aren't
  kept in Workers Logs.
- The Worker logs only fixed objects on failure. It never logs the question
  text, IP, hash, headers or `request.cf`.
- Deleted rows stay restorable through D1 Time Travel for up to 30 days. This
  can't be turned off, and the `/privacy` page says so.

## Deleting one person's data

Requests go to hello@eythorkonrads.com and get an answer within one month
(Art. 12(3)). Look the row up first, check that exactly one row matches, then
delete it by its `id`. The IP hash is gone within the hour, so no query is
needed for it.

### An Unanswered question

Ask the person to quote their question. Search for a distinctive part of it:

```sh
npx wrangler d1 execute portfolio-ask --remote \
  --command "SELECT id, date, question FROM unanswered_questions WHERE question LIKE '%<quoted text>%'"
```

Then delete the matching row:

```sh
npx wrangler d1 execute portfolio-ask --remote \
  --command "DELETE FROM unanswered_questions WHERE id = '<id>'"
```

### A Scoreboard entry

Ask for the score and the day it was played. `date` is a full ISO timestamp,
so match on the day:

```sh
npx wrangler d1 execute portfolio-scores --remote \
  --command "SELECT id, initials, score, date FROM entries WHERE score = <score> AND date LIKE '<YYYY-MM-DD>%'"
```

Then delete the matching row:

```sh
npx wrangler d1 execute portfolio-scores --remote \
  --command "DELETE FROM entries WHERE id = '<id>'"
```

If the quoted text holds a `'`, write it as `''` in the `LIKE` lookup.

# Ask: rate-limit storage

Research for issue #138 (map #136). Question: for a per-visitor limit
(questions per hour per IP) and a site-wide daily cap, should Ask use the
Workers rate-limiting binding, a counter in Ask's own D1 database
(`ASK_DB`), or both?

Checked 2026-11-16 against Cloudflare's docs and the Miniflare source that
`wrangler dev` runs.

## Answer

Use a counter in `ASK_DB` for both limits. The rate-limiting binding can't
express either one:

- Its window is 10 or 60 seconds, nothing longer, so it can't count per hour
  or per day.
- It counts separately in each Cloudflare location and only approximately, so
  it can't enforce a site-wide cap.

D1 gives one exact count for the whole site, fits easily in the free tier at
Ask's volume, and works the same way in `wrangler dev` and behind an injected
dependency in tests. The binding could be added later as a cheap burst guard
(say 3 questions per 60 s) in front of Turnstile and D1, but nothing in the
map needs one.

## Rate-limiting binding

- Configured under `ratelimits` with `name`, `namespace_id` and
  `simple: { limit, period }`. "`simple` is the only supported type", and
  `period` "Must be either `10` or `60`" seconds. [rate-limit]
- `env.X.limit({ key, delta? })` resolves to `{ success }`. A call that
  returns `success: false` does not add to the count. [rate-limit]
- Locality: "Requests served in another Cloudflare location count toward a
  separate limit, even with the same namespace and key. These counts do not
  combine into one worldwide limit." [rate-limit]
- Accuracy: "approximate ... eventually consistent", and "Requests can exceed
  your configured limit before those updates arrive", even with one Worker in
  one location. Awaiting `limit()` doesn't make it strict. For a strict
  limit, Cloudflare points to Durable Objects. [rate-limit]
- Keys: the docs advise against IP addresses as keys because many users can
  share one (mobile networks, proxies). [rate-limit] That applies to a D1
  counter keyed on IP too.
- No dashboard view. Monitoring is through Workers Logs or Analytics Engine.
  [rate-limit]
- Stable (GA) since 2025-09-19. [ga] Needs Wrangler 4.36.0 or later (this
  repo has `^4.158.0`). [rate-limit]
- Price and free-plan availability: neither the binding page nor the Workers
  pricing page mentions a price or a plan restriction. [rate-limit] [pricing]
  Not confirmed either way.
- `wrangler dev`: Miniflare simulates it with a local Durable Object holding
  one counter per key, in windows aligned to the wall clock
  (`epoch = floor(now / period)`). It also rejects periods other than 10 or 60. [miniflare] Locally it is exact, so local tests would not show the
  per-location over-counting that production has.

## D1 counter

- Free plan: 5 million rows read and 100,000 rows written a day, 5 GB
  storage, 10 databases. The daily limits reset at 00:00 UTC. Past a limit,
  "queries fail" until the reset. [d1-pricing]
- Writing to an indexed column costs one extra row written. [d1-pricing]
- 50 queries per Worker invocation on Free; 500 MB per database on Free.
  [d1-limits]
- "Each database is single-threaded and handles one query at a time", so a
  single `INSERT ... ON CONFLICT DO UPDATE SET n = n + 1 RETURNING n` gives
  one exact, site-wide count with no race between requests. [d1-limits]
  [sqlite-upsert]
- Cost per question: an upsert on the visitor's hour row and one on the day
  row is about 2 rows written, or 4 with an index on each. At 100,000 writes
  a day, the free tier allows roughly 25,000 questions a day, far more than
  any daily cap Ask would set for Claude API cost.
- Old counter rows can be deleted when a row is written (for example, delete
  hour rows older than an hour), so no cron is needed. That bears on the
  map's open question about how the 90-day deletion of Unanswered questions
  runs.
- Privacy: a per-IP row stores the IP (or a hash of it) for up to an hour.
  The map stores no IP with Unanswered questions. Whether storing a hash
  briefly for the rate limit is acceptable is for Eythor to decide.

## Workers free tier (context)

- 100,000 requests a day, resetting at midnight UTC; past that, Error 1027
  (the route fails open or closed). 10 ms CPU per request, 50 subrequests per
  invocation. [limits]
- Only `/api/*` runs the Worker (`run_worker_first` in `wrangler.jsonc`), so
  Ask's requests share that budget with `/api/scores`.

## Dev, previews and tests

|                       | Binding                                  | D1 counter                                                                                                                    |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `wrangler dev`        | Simulated, exact and per key [miniflare] | Local D1, same as Scores (`docs/scoreboard.md`)                                                                               |
| PR previews           | Undocumented for `ratelimits` [previews] | Previews "do not inherit production settings". D1 is isolated only if the `previews` block binds another database. [previews] |
| Tests (injected deps) | Fake `{ limit() }` object                | Fake store with in-memory counts, like the Scores `store` in `worker/handler.mjs`                                             |

Ask is off in PR previews, so the handler should return "unavailable" before
it checks any limit. Leaving `ASK_DB` (and any `ratelimits`) out of the
`previews` block fits that. Either choice tests the same way: the handler
takes something like `limits.check(visitor)` and a component spec passes an
in-memory version, so no test needs a real binding or database.

## Sources

- [rate-limit]: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ 'source: `cloudflare/cloudflare-docs`,
`src/content/docs/workers/runtime-apis/bindings/rate-limit.mdx`'
- [ga]: https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/
- [pricing]: https://developers.cloudflare.com/workers/platform/pricing/
- [limits]: https://developers.cloudflare.com/workers/platform/limits/
- [d1-pricing]: https://developers.cloudflare.com/d1/platform/pricing/
- [d1-limits]: https://developers.cloudflare.com/d1/platform/limits/
- [previews]: https://developers.cloudflare.com/workers/previews/
- [sqlite-upsert]: https://www.sqlite.org/lang_upsert.html and
  https://www.sqlite.org/lang_returning.html
- [miniflare]: `miniflare` 5.20261104.0-beta,
  `dist/src/workers/ratelimit/ratelimit.worker.js` and
  `ratelimit-object.worker.js`

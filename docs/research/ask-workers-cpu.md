# Research: Workers plan and CPU time per Ask question

Research for #149, under map #136 (Ask, #135). Checked on 2026-11-17 against
the Cloudflare API and docs, `@anthropic-ai/sdk` 1.8.0, Wrangler 4.158.0 and
Node 26.12.0.

## Question

1. Which Workers plan is the account on?
2. Does time spent waiting on `fetch` count as CPU time?
3. How much CPU do importing `@anthropic-ai/sdk` and parsing JSON cost?
4. What happens when a request goes over the CPU limit?
5. Does one Ask request (Turnstile check, two or three D1 queries, an HMAC,
   one Claude call through the SDK with structured outputs) fit the Free
   plan's 10 ms?

## Short answers

1. **Free.** The account has no Workers Paid subscription: a read of the
   Containers API answers "Deploying containers requires the Workers Paid
   plan". The billing endpoints can't be read with the Wrangler token, so this
   is indirect, but it is the only signal and it is unambiguous.
2. **No.** Waiting on `fetch()`, KV and database queries doesn't count.
   Turnstile, D1 and the Claude API call are all waiting, so the Claude call's
   seconds of wall time cost no CPU.
3. **About 0.3 ms per request once the isolate is warm, all of Ask included.**
   Evaluating the SDK's 1 MB bundle costs about 10 ms, and the first request
   through a fresh isolate costs a few ms more. Cloudflare documents startup
   as a separate 1 s limit and doesn't say it counts toward the 10 ms. Parsing
   the response JSON is a small part of this.
4. **Error 1102** ("Worker exceeded resource limits") to the visitor, logged
   as `exceededCpu`. An isolate is allowed to go over now and then; it is
   stopped when it goes over consistently.
5. **Yes, with a margin, once warm.** The risk is the first request in a new
   isolate. If those get 1102 errors in practice, the fix is the Workers Paid
   plan ($5/month), not code changes. See [Recommendation](#recommendation).

## Findings

### 1. The account's plan

Read with the Wrangler login, as in `docs/agents/cloudflare.md`
(read-only `GET` requests; the token was kept out of output).

- `GET /accounts/<id>/workers/account-settings`: `default_usage_model:
"standard"`. Standard is the only usage model on both plans now, so this
  says nothing about the plan.
- `GET /accounts/<id>/workers/scripts`: five Workers (`dreaminfluence`,
  `guesser`, `portfolio`, `sudoku`, `trackman`), all `standard`.
- `GET /accounts/<id>/subscriptions`, `/user/subscriptions` and
  `/accounts/<id>/billing/profile`: "Authentication error". The Wrangler OAuth
  scopes include `account (read)` but no billing scope.
- `GET /accounts/<id>/containers/applications`: "Unauthorized: You do not have
  access to Cloudflare Containers. Deploying containers requires the Workers
  Paid plan." This is the signal that the account is on **Free**.
- The three zones (`eythorkonrads.com`, `ekonrads.com`, `wevenapp.com`) are on
  the Free Website plan, which is separate from the Workers plan.

So Ask, as specified, runs under the Free plan's limits: 10 ms CPU per
request, 100,000 requests a day for the whole account (shared by all five
Workers), and 50 subrequests per request
([Limits](https://developers.cloudflare.com/workers/platform/limits/)).

The `portfolio` Worker's current CPU use, from the GraphQL Analytics API
(`workersInvocationsAdaptive`, 2026-11-10 to 2026-11-17): 185 requests, all
successful, CPU p50 0.26 ms, p99 1.6 ms, max 1.9 ms. Wall time p99 85 ms. The
Worker only runs for `/api/*` (Scores), so these are D1 requests.

### 2. Waiting on fetch is not CPU time

From [Limits](https://developers.cloudflare.com/workers/platform/limits/),
CPU time section:

> CPU time measures how long the CPU spends executing your Worker code.
> Waiting on network requests (such as `fetch()` calls, KV reads, or database
> queries) does not count toward CPU time.

The same section puts the average Worker at about 2.2 ms, and says "heavier
workloads that handle authentication, server-side rendering, or parse large
payloads typically use 10-20 ms."

Each Ask step against that:

| Step                                     | CPU                       |
| ---------------------------------------- | ------------------------- |
| Turnstile `siteverify` fetch             | waiting, not counted      |
| Two or three D1 queries                  | waiting, not counted      |
| HMAC of the IP (WebCrypto)               | native code, microseconds |
| Claude API call (seconds of wall time)   | waiting, not counted      |
| Building the request, parsing the answer | JS, measured below        |

### 3. CPU cost of the SDK and JSON parsing

**Method.** A probe Worker in a scratch folder imported `@anthropic-ai/sdk`
1.8.0 and `jsonSchemaOutputFormat`, built a client per request, and called
`messages.parse()` with an about-32,000-character cached system prompt and a
`{ answered, answer }` schema. A fake `fetch` returned a realistic response (a
2,000-character thinking block plus the JSON answer), so the measurement is
pure CPU: the SDK's request building, response parsing, `parsed_output`
validation, then an HMAC-SHA-256 of an IP. It was bundled with
`wrangler deploy --dry-run` (1,065 KiB, 182 KiB gzipped, the same as in the
#142 research) and the bundle was timed in Node with `process.cpuUsage()`,
five runs. A baseline did the same work without the SDK (`JSON.stringify` the
request, `Response.json()`, `JSON.parse` the answer text, HMAC).

| Measurement (Node, M-series Mac) | With SDK     | Without SDK  |
| -------------------------------- | ------------ | ------------ |
| Module evaluation                | 9.4–10.0 ms  | 0.5 ms       |
| First request in the process     | 17.7–19.8 ms | 14.8–16.2 ms |
| Each later request (mean of 200) | 0.28–0.30 ms | 0.09 ms      |

Reading the numbers:

- **Warm requests cost about 0.3 ms**, so the SDK adds about 0.2 ms over raw
  `fetch` and JSON. Parsing a few KB of JSON is a small slice of that. A warm
  Ask request is about 30 times under the limit.
- **The first request** is mostly Node's own one-time setup of `Response` and
  WebCrypto, which the baseline pays too; the SDK adds about 3–4 ms on top
  (lazy compilation of its code paths). workerd's setup cost differs from
  Node's, so this row is only a rough guide to the first request on
  Cloudflare.
- **Module evaluation** of the SDK bundle is about 10 ms here. Cloudflare's
  CPUs are different, so the real figure may be higher or lower.

`wrangler check startup` (a local workerd startup profile) was also tried. It
took only 3–6 samples per run and swung between 6 and 16 ms for both the probe
and the baseline, so it can't tell them apart.

What wasn't measured: the real CPU time on Cloudflare. That needs a deploy,
which this research didn't do on the shared account. After Ask ships, the same
GraphQL query as above (`cpuTimeP99`, `max { cpuTime }`) and the `exceededCpu`
outcome show it.

### Does startup count toward the 10 ms?

Not documented. [Limits](https://developers.cloudflare.com/workers/platform/limits/)
gives startup its own limit:

> A Worker must parse and execute its global scope (top-level code outside of
> handlers) within 1 second.

Breaking it fails the deploy with `Script startup exceeded CPU time limit`
(code 10021). Neither the CPU time section nor
[How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/)
says whether global-scope time is billed to the first request's 10 ms. Treat
it as possible. Isolates are reused for later requests but "are not
necessarily long-lived", so on a quiet site many Ask requests could be the
first in their isolate.

### 4. Over the limit

From [Limits](https://developers.cloudflare.com/workers/platform/limits/):

> Each isolate has some built-in flexibility to allow for cases where your
> Worker infrequently runs over the configured limit. If your Worker starts
> hitting the limit consistently, its execution will be terminated according
> to the limit configured.

> When a Worker exceeds its CPU time limit, Cloudflare returns Error 1102 to
> the client with the message `Worker exceeded resource limits`.

It shows as "Exceeded CPU Time Limits" in the dashboard and `exceededCpu` in
analytics and Logpush. The Worker's code doesn't get to send its own error, so
Ask's front end should treat a non-JSON or 1102 response as the shared
"unavailable" alert. Because the Worker is stopped, a request cut off after the
Claude call has been made still costs the tokens.

Over the account's daily request limit (100,000, midnight UTC), requests get
Error 1027, or bypass the Worker if the route fails open. Ask's own cap of 100
questions a day is far below this.

### 5. The Paid plan, if it's needed

From [Pricing](https://developers.cloudflare.com/workers/platform/pricing/):
Workers Paid is a minimum of $5 a month per account, with 30 million CPU ms a
month included (then $0.02 per million) and up to 5 minutes of CPU per
request (default 30 s). It covers all five Workers on the account. At 100
questions a day, Ask would use well under 1% of the included CPU.

## Recommendation

- Build Ask on the Free plan as specified. Warm requests are about 0.3 ms;
  only the first request in a new isolate is at risk.
- Create the Anthropic client inside the handler (or lazily, once) rather than
  doing other work at the top level, and keep the About file a string import,
  not something parsed at startup.
- After launch, check `exceededCpu` and `cpuTimeP99` for `portfolio` with the
  GraphQL query above. If 1102s show up, the choices are the Paid plan
  ($5/month, the simple fix) or calling the Messages API with plain `fetch`
  instead of the SDK (module evaluation 0.5 ms instead of 10 ms), which reopens
  #142's decision.
- Add to Eythor's checklist: decide whether to pre-emptively take Workers Paid.
  It's an account-wide change, shared with four other Workers, so it's his
  call.

## Sources

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): CPU time definition and per-plan limits, the 1102 error and burst flexibility, startup limit, subrequests, daily requests.
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): Paid plan price, included CPU ms, per-request maximum.
- [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/): isolate reuse and lifetime.
- [Metrics and analytics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/): CPU and wall time charts.
- Cloudflare API, read on 2026-11-17: `workers/account-settings`, `workers/scripts`, `workers/scripts/portfolio/settings`, `containers/applications`, `zones`, and the GraphQL Analytics API (`workersInvocationsAdaptive`).
- Local probe: `@anthropic-ai/sdk` 1.8.0 bundled with `wrangler deploy --dry-run` (Wrangler 4.158.0, `compatibility_date` 2026-11-01, no `nodejs_compat`), timed in Node 26.12.0.
- Earlier research: [ask-claude-api-worker.md](https://github.com/EythorKonrads/Portfolio/blob/research/ask-claude-api-worker/docs/research/ask-claude-api-worker.md) (#142).

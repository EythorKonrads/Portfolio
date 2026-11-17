# Ask: client IPs in Workers Logs

Research for issue #150 (map #136). Question: do Workers Logs, `wrangler tail`
and the observability settings in `wrangler.jsonc` record the client's IP
address? If so, how does the `portfolio` Worker keep raw IPs out of them while
still reading `CF-Connecting-IP` to build the salted HMAC hash that #144
settled on ("raw IPs are never logged")?

Checked 2026-11-17 against Cloudflare's developer docs and the account's
script settings, read through the API (read-only).

## Answer

- **Yes, when Workers Logs is on, every invocation log stores the client IP.**
  An invocation log holds the request, including its headers, and Cloudflare
  redacts headers only by name (cookies and names containing "auth", "key",
  "secret", "token" or "jwt"). `CF-Connecting-IP` and `X-Forwarded-For` match
  none of these, so their values are kept as they are.
- **`wrangler tail` (real-time logs) shows the same headers live**, but stores
  nothing. It can filter by client IP (`--ip`), so it clearly has it.
- **Today nothing is stored.** `wrangler.jsonc` has no `observability` key, and
  the API reports `observability: null`, `logpush: false` and no Tail Workers
  for `portfolio` (and for every other Worker on the account).
- **The switch that keeps IPs out:** set
  `"observability": { "logs": { "invocation_logs": false } }` (keeps
  `console.log` output, drops the per-request record with headers), or leave
  Workers Logs off. There is no per-header redaction setting.
- **In code:** never log the request, its headers, `request.cf`, or the IP
  itself, and never put the IP in an error message or thrown exception. Read
  `CF-Connecting-IP`, hash it, and pass only the hash on.
- **Retention:** Workers Logs keeps logs 3 days on Workers Free, 7 days on
  Workers Paid. Traces keep 7 days. Real-time logs keep nothing.

## What each log source records

### Workers Logs (stored)

Workers Logs is turned on with the `observability` setting in the Wrangler
file; a Worker "must add the observability setting ... to write logs to
Workers Logs" ([Workers Logs][wl]). Once on, it stores two kinds of record:

- what the Worker writes with `console.log` and friends, and
- one **invocation log** per request, which "contains details such as the
  Request, Response, and related metadata" and "is enriched with information
  available to Cloudflare in the context of the invocation" ([Workers
  Logs][wl]).

The docs don't list an invocation log's fields one by one. Cloudflare's own
announcement says "each log entry contains an event with a list of logs,
exceptions, and request headers if it was triggered by an HTTP request", and
that "if your Worker doesn't generate any logs or exceptions, you will still be
able to see the request headers from the event" ([dashboard logs blog][blog]).
The Tail Worker event shape, which these logs are built on, has
`event.request.headers` and `event.request.cf` ([Tail Workers][tw], [Tail
handler][th]).

**Headers are redacted only by name.** "The header value will be the string
'REDACTED' when the (case-insensitive) header name is `cookie`/`set-cookie` or
contains a substring `auth`, `key`, `secret`, `token`, or `jwt`", and "the
redactions use heuristic rules, so they are subject to false positives and
negatives" ([Tail handler][th]). The blog says the same: Cloudflare redacts
"Authorization, Cookie, or anything else that appears to have a sensitive
name" ([blog][blog]).

The client IP reaches a Worker in these headers ([Cloudflare HTTP
headers][hdr]):

- `CF-Connecting-IP`: "the client IP address connecting to Cloudflare".
- `X-Forwarded-For`: with no incoming header, "an identical value to the
  `CF-Connecting-IP` header".
- `X-Real-IP` is present in the Worker context too (the docs describe it as
  what `CF-Connecting-IP` reflects on same-zone subrequests).
- `True-Client-IP` only on Enterprise with a Managed Transform; not this site.

None of these names contains a redacted substring, so **an invocation log
keeps the raw IP in at least two headers**. This last step is an inference
from the documented rule; the docs never name `CF-Connecting-IP` as kept or
redacted. It can be confirmed in the dashboard's Logs tab once logs are on.

`request.cf` (`IncomingRequestCfProperties`) has no IP field, but it does hold
`city`, `postalCode`, `latitude`, `longitude`, `asn` and TLS fingerprints
([Request][req]). That is location data, not an IP, and no Ask decision covers
it; turning invocation logs off drops it too.

Logs may be stored "in Cloudflare's core data centers globally" unless the
account has a Customer Metadata Boundary ([Workers Logs][wl]).

### `wrangler tail` and the dashboard's live logs (not stored)

Real-time logs stream each request as it happens. The example entry has
`event.request` with `url`, `method`, `headers` and `cf` ([Real-time
logs][rt]); the same header redaction applies. `wrangler tail` takes
`--ip <address>` ("Filter by the IP address the request originates from. Use
'self' to filter for your own IP") ([Wrangler commands][cmd]).

"Real-time logs does not store Workers Logs" ([Real-time logs][rt]). So tail
shows raw IPs to whoever runs it (only account members), but keeps no copy.
That isn't logging in the GDPR-storage sense, but it is worth knowing when
reading tail output in a shared terminal or pasting it into an issue.

### Traces

Traces are off unless `observability.traces.enabled = true` ([Traces][tr]).
Their documented attributes include a few request headers (content type,
accept, accept-language), the user agent, coarse geo and ASN, but no client
address and no IP headers ([Spans and attributes][span]). Retention is seven
days ([Traces][tr]). Not needed for Ask.

### Logpush and Tail Workers

Both forward the same event (headers included) elsewhere. Neither is set up:
the API reports `logpush: false` and `tail_consumers: null` for `portfolio`.

## This repo's settings

`wrangler.jsonc` has no `observability` key. Cloudflare's docs say
`observability.enabled` "defaults to `true` for all new Workers" and "all newly
created Workers will come with the observability setting enabled by default"
([Wrangler configuration][cfg], [Workers Logs][wl]), but `portfolio` predates
that or was deployed without it: the script-settings API returns
`observability: null` today. So **no Workers Logs are stored now**, and no
raw IP is in any stored log.

Read from `GET /accounts/<id>/workers/scripts/portfolio/script-settings` and
`GET /accounts/<id>/workers/scripts` on 2026-11-17. The Wrangler login's token
can't query the logs themselves (`no_access_to_workers_observability`), so the
fields of a real invocation log weren't seen.

Because the docs don't say what a deploy does when the key is missing,
writing the setting down explicitly is safer than relying on `null`.

## Keeping raw IPs out

### Configuration

Two options, both in `wrangler.jsonc`:

1. **Logs on, invocation logs off (recommended if logs are wanted for Ask):**

   ```jsonc
   "observability": {
     "enabled": true,
     "logs": { "invocation_logs": false },
   },
   ```

   "Invocation logs can be disabled in wrangler by adding the
   `invocation_logs = false` configuration" ([Workers Logs][wl]). Only what the
   Worker itself logs is stored, so the code decides what goes in.

2. **Logs off:** `"observability": { "enabled": false }`. Nothing is stored;
   errors are visible only through `wrangler tail` while it runs.

There is no setting to redact one header or to drop the IP while keeping the
rest of the invocation log. `head_sampling_rate` only lowers how many requests
are logged, not what each log holds.

`observability` is inheritable, so the `previews` block gets the same setting
([Wrangler configuration][cfg]).

### Code rules for the `portfolio` Worker

With invocation logs off, anything the Worker prints is what's stored, so:

- Read the IP once, `request.headers.get('CF-Connecting-IP')`, hash it with
  HMAC-SHA-256 and the secret, and pass only the hash to the rate limiter.
  Don't keep the raw value in a variable that outlives the hash step.
- Never `console.log` (or `.error`, `.warn`, `.info`, `.debug`) the `request`,
  `request.headers`, `Object.fromEntries(request.headers)`, `request.cf`, or
  the IP.
- Never put the IP or headers in an error message, a thrown `Error`, or an
  object that may be logged on failure. Uncaught exceptions are logged too
  ([blog][blog]).
- Don't log the hash either unless there's a reason: it is still pseudonymised
  personal data (#144).
- Don't forward `CF-Connecting-IP`, `X-Forwarded-For` or `X-Real-IP` to the
  Claude API; build outgoing requests from scratch rather than copying the
  incoming headers.
- Don't log the question text for answered questions; #136 says answered
  questions are not stored.

A component spec can check the handler's part: inject a fake `console` or spy
on it and assert no call contains the test IP.

## Spec checklist

- Add `"observability": { "enabled": true, "logs": { "invocation_logs": false } }`
  (or `"enabled": false`) to `wrangler.jsonc` in the Ask PR.
- Worker code: read `CF-Connecting-IP` only to hash it; log nothing from the
  request.
- Privacy notice / Art. 30 record: Worker logs (if on) keep the Worker's own
  log lines for 3 days (Free) or 7 days (Paid) and contain no IP.

## Sources

- [Workers Logs][wl]
- [Real-time logs][rt]
- [Tail Workers][tw]
- [Tail handler (TailRequest redaction)][th]
- [Introducing logs from the dashboard for Cloudflare Workers][blog]
- [Wrangler configuration: observability][cfg]
- [Wrangler commands: `wrangler tail`][cmd]
- [Cloudflare HTTP headers][hdr]
- [Request: `IncomingRequestCfProperties`][req]
- [Traces][tr], [Spans and attributes][span]

[wl]: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
[rt]: https://developers.cloudflare.com/workers/observability/logs/real-time-logs/
[tw]: https://developers.cloudflare.com/workers/observability/logs/tail-workers/
[th]: https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/
[blog]: https://blog.cloudflare.com/introducing-workers-dashboard-logs/
[cfg]: https://developers.cloudflare.com/workers/wrangler/configuration/
[cmd]: https://developers.cloudflare.com/workers/wrangler/commands/workers/
[hdr]: https://developers.cloudflare.com/fundamentals/reference/http-headers/
[req]: https://developers.cloudflare.com/workers/runtime-apis/request/
[tr]: https://developers.cloudflare.com/workers/observability/traces/
[span]: https://developers.cloudflare.com/workers/observability/traces/spans-and-attributes/

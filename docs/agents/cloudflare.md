# Cloudflare

Facts an agent can't find in this repo, for changing the Cloudflare account or
giving directions in its dashboard.

## The account is shared

Other Workers run on this account beside `portfolio`. Account settings affect
all of them. The `workers.dev` subdomain is one such setting: every Worker's
`workers.dev` and preview URL contains it.

Before proposing a change to an account setting, list the Workers and check how
each one is affected.

## Reading the account

The Wrangler login can read the API. Get the account ID from
`npx wrangler whoami`, and keep the token out of command output:

```sh
TOKEN=$(npx wrangler auth token 2>/dev/null | tail -n 1)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts \
  | jq '[.result[].id]'
```

For the current subdomain, use the path `.../workers/subdomain`.

## Dashboard directions

The subdomain is edited on the Workers & Pages overview (under Compute): the
Account details panel on the right, then the pencil icon next to Subdomain. A
single Worker's Domains tab shows its URLs and has no way to edit the subdomain.

## Renaming the subdomain

`PUT /accounts/<account_id>/workers/subdomain` has not been tried on this
account, so it is unknown whether it renames an existing subdomain. If it
refuses, stop and report back, and leave the existing subdomain in place. Issue
#99 was closed without renaming because of the shared account.

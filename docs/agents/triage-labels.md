# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Apply `ready-for-agent` only when the issue states the expected behaviour as something an agent can check, including who it applies to and what must stay the same. Otherwise apply `needs-info` and ask for it.

For a change to something shared beyond this repo (Cloudflare account settings, DNS, domains), the issue lists everything else that shares it and how each is affected.

Apply `ready-for-human` to Cloudflare account, DNS and domain changes, since auto mode blocks an agent from making them. The agent does the read-only checks and supplies the exact command.

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.

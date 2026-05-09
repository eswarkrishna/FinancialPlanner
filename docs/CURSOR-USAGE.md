# Cursor usage capture (local)

This repo logs **Cursor Agent session start and session end** events to a **local, gitignored** file so you can correlate sessions and inspect hook payloads.

## What runs

| When | Hook config | Script |
|------|-------------|--------|
| Session starts | `sessionStart` in `.cursor/hooks.json` | `.cursor/hooks/session-spec-context.mjs` (spec context **and** usage line) |
| Session ends | `sessionEnd` in `.cursor/hooks.json` | `.cursor/hooks/cursor-usage-session-end.mjs` |

Shared helper: `.cursor/hooks/cursor-usage-append.mjs` appends one NDJSON record.

**Output:** `.cursor/usage/sessions.ndjson` (one JSON object per line)

Example lines:

```json
{"recordedAt":"…","hook":"sessionStart","workspaceRoot":"…","payload":{ … }}
{"recordedAt":"…","hook":"sessionEnd","workspaceRoot":"…","payload":{ … }}
```

If stdin is empty or not JSON, `payload` may be `null` or a small fallback object.

## Privacy

- The directory `.cursor/usage/` is listed in `.gitignore`. **Do not** commit these files if `payload` might include prompts or paths you consider sensitive.
- To stop logging:
  - **sessionEnd:** remove or comment out the `sessionEnd` entry in `.cursor/hooks.json` (e.g. point back at `.cursor/hooks/session-end-noop.mjs`).
  - **sessionStart:** remove the `appendUsageRecord(...)` block from `session-spec-context.mjs` if you still want spec injection without logging.

## Subscription / billing usage

Plan limits and invoice-style **usage** (Fast requests, etc.) live in the Cursor app (**Settings → Cursor Settings → Account / Usage**) or on your Cursor account online—not in this log.

## Viewing the log

From the repo root:

```bash
# Last 5 records (pretty-print each line — requires jq)
tail -n 5 .cursor/usage/sessions.ndjson | jq .

# Line count
wc -l .cursor/usage/sessions.ndjson
```

On Windows PowerShell:

```powershell
Get-Content .cursor\usage\sessions.ndjson -Tail 5
```

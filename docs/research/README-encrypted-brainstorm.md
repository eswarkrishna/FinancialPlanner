# Encrypted brainstorm bundle

The client growth & productivity brainstorm is stored **encrypted at rest**.

## Files

| File | Purpose |
|------|---------|
| `2026-07-client-growth-productivity-brainstorm.enc.json` | Encrypted payload (AES-256-GCM) |
| `view-encrypted-brainstorm.html` | Browser viewer — **prompts for your key** on open |
| `../scripts/encrypt-brainstorm.mjs` | CLI encrypt / decrypt |

Plaintext markdown (`2026-07-client-growth-productivity-brainstorm.md`) is gitignored.

## Encrypt (first time or re-key)

```bash
node scripts/encrypt-brainstorm.mjs encrypt
# prompts for key twice, or:
node scripts/encrypt-brainstorm.mjs encrypt --password 'your-passphrase' --remove-plain
```

## View in browser

Open `view-encrypted-brainstorm.html` locally (double-click or `npm run dev` is not required). Enter your passphrase when prompted. Decryption runs entirely in the browser; the key is never uploaded.

## Decrypt to stdout (CLI)

```bash
node scripts/encrypt-brainstorm.mjs decrypt --password 'your-passphrase'
```

## Security notes

- Use a passphrase of **at least 8 characters** (longer is better).
- Do not commit your passphrase or the plaintext `.md` file.
- If you lose the key, the encrypted file cannot be recovered.

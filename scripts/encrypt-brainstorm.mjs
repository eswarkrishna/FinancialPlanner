#!/usr/bin/env node
/**
 * Encrypt / decrypt the client-growth brainstorm markdown with a user passphrase.
 * Uses PBKDF2 + AES-256-GCM (decryptable in browser via view-encrypted-brainstorm.html).
 *
 * Usage:
 *   node scripts/encrypt-brainstorm.mjs encrypt --password 'your-key'
 *   node scripts/encrypt-brainstorm.mjs decrypt --password 'your-key'
 *   node scripts/encrypt-brainstorm.mjs encrypt   # prompts for password (twice)
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PLAIN = join(ROOT, 'docs/research/2026-07-client-growth-productivity-brainstorm.md');
const ENC = join(ROOT, 'docs/research/2026-07-client-growth-productivity-brainstorm.enc.json');
const VIEWER = join(ROOT, 'docs/research/view-encrypted-brainstorm.html');

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;
const PBKDF2_ITERATIONS = 100_000;

function deriveKey(password, salt) {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
}

function encrypt(plaintext, password) {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(password, salt);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    algorithm: ALGO,
    kdf: 'pbkdf2',
    kdfHash: 'sha256',
    iterations: PBKDF2_ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    createdAt: new Date().toISOString(),
    title: 'Client growth & productivity brainstorm',
    hint: 'Open docs/research/view-encrypted-brainstorm.html and enter your passphrase.',
  };
}

function decrypt(payload, password) {
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function embedInViewer(payload) {
  const template = readFileSync(VIEWER, 'utf8');
  const json = JSON.stringify(payload, null, 2);
  const updated = template.replace(
    /PLACEHOLDER_LOAD_ENC_JSON/,
    json.replace(/</g, '\\u003c')
  );
  writeFileSync(VIEWER, updated, 'utf8');
}

async function promptHidden(label) {
  if (!process.stdin.isTTY) {
    throw new Error('No TTY — pass --password on the command line.');
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(`${label}: `, resolve);
  });
  rl.close();
  return answer;
}

async function getPassword(flagValue, confirm = false) {
  if (flagValue) return flagValue;
  const p1 = await promptHidden('Enter encryption key');
  if (!confirm) return p1;
  const p2 = await promptHidden('Confirm encryption key');
  if (p1 !== p2) throw new Error('Passphrases do not match.');
  return p1;
}

function parseArgs(argv) {
  const args = { cmd: argv[2], password: undefined, removePlain: false };
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--password' && argv[i + 1]) {
      args.password = argv[++i];
    }
    if (argv[i] === '--remove-plain') {
      args.removePlain = true;
    }
  }
  return args;
}

async function main() {
  const { cmd, password: pwFlag, removePlain } = parseArgs(process.argv);

  if (cmd === 'encrypt') {
    if (!existsSync(PLAIN)) {
      throw new Error(`Plaintext not found: ${PLAIN}`);
    }
    const password = await getPassword(pwFlag, true);
    if (!password || password.length < 8) {
      throw new Error('Use a passphrase of at least 8 characters.');
    }
    const plaintext = readFileSync(PLAIN, 'utf8');
    const payload = encrypt(plaintext, password);
    writeFileSync(ENC, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    embedInViewer(payload);
    console.log(`Encrypted → ${ENC}`);
    console.log(`Viewer updated → ${VIEWER}`);
    if (removePlain) {
      writeFileSync(PLAIN, '', 'utf8');
      console.log('Plaintext cleared (--remove-plain).');
    } else {
      console.log('Tip: re-run with --remove-plain after verifying decryption.');
    }
    return;
  }

  if (cmd === 'decrypt') {
    if (!existsSync(ENC)) {
      throw new Error(`Encrypted file not found: ${ENC}`);
    }
    const password = await getPassword(pwFlag);
    const payload = JSON.parse(readFileSync(ENC, 'utf8'));
    try {
      const plaintext = decrypt(payload, password);
      process.stdout.write(plaintext);
    } catch {
      console.error('Decryption failed — wrong key or corrupted file.');
      process.exit(1);
    }
    return;
  }

  console.error(`Usage:
  node scripts/encrypt-brainstorm.mjs encrypt [--password 'key'] [--remove-plain]
  node scripts/encrypt-brainstorm.mjs decrypt [--password 'key']`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

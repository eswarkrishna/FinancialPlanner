/**
 * sessionEnd hook — observational / fire-and-forget per Cursor docs.
 * Drains stdin so the process can exit cleanly.
 */
async function main() {
  try {
    for await (const _chunk of process.stdin) {
      /* discard */
    }
  } catch {
    // ignore
  }
}

main();

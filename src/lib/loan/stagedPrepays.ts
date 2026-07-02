export interface StagedPrepayEntry {
  id: string;
  month: string;
  amount_inr: string;
}

/** Parse staged prepay form rows into timed events; skips invalid rows. */
export function parseStagedPrepays(
  entries: StagedPrepayEntry[],
): { month: number; amount_inr: number }[] {
  const events: { month: number; amount_inr: number }[] = [];
  for (const entry of entries) {
    const month = Number.parseInt(entry.month, 10);
    const amount = Number.parseFloat(entry.amount_inr);
    if (!Number.isFinite(month) || month < 1) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    events.push({ month, amount_inr: amount });
  }
  return events;
}

let stagedIdCounter = 0;

export function newStagedPrepayEntry(): StagedPrepayEntry {
  stagedIdCounter += 1;
  return { id: `staged-${stagedIdCounter}`, month: "", amount_inr: "" };
}

export function stagedPrepaysFromEvents(
  events: { month: number; amount_inr: number }[],
): StagedPrepayEntry[] {
  return events.map((event) => {
    stagedIdCounter += 1;
    return {
      id: `staged-${stagedIdCounter}`,
      month: String(event.month),
      amount_inr: String(event.amount_inr),
    };
  });
}

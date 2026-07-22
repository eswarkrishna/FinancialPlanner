export type RateChangeEntry = {
  id: string;
  month: string;
  annual_rate: string;
};

export type ParsedRateChange = {
  month: number;
  annual_rate: number;
};

export function newRateChangeEntry(): RateChangeEntry {
  return {
    id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    month: "",
    annual_rate: "",
  };
}

export function parseRateChanges(entries: RateChangeEntry[]): ParsedRateChange[] {
  const parsed: ParsedRateChange[] = [];
  for (const entry of entries) {
    const month = Number.parseInt(entry.month, 10);
    const annual_rate = Number.parseFloat(entry.annual_rate);
    if (!Number.isFinite(month) || month < 2) continue;
    if (!Number.isFinite(annual_rate) || annual_rate < 0 || annual_rate > 50) continue;
    parsed.push({ month, annual_rate });
  }
  parsed.sort((a, b) => a.month - b.month);
  const deduped: ParsedRateChange[] = [];
  for (const change of parsed) {
    if (deduped.some((entry) => entry.month === change.month)) continue;
    deduped.push(change);
  }
  return deduped;
}

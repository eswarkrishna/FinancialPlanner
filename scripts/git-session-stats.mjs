/**
 * Stats from git history:
 * - Sum inter-commit gaps only when gap <= MAX_GAP_SEC (session continuation).
 * - For gaps > MAX_GAP_SEC, count calendar dates strictly between the two
 *   commit dates (--date=short, author timezone), union across repo.
 */
import { execSync } from "node:child_process";

const MAX_GAP_SEC = 3 * 3600;

function parseLines() {
  const out = execSync('git log --reverse --format="%at %ad" --date=short', {
    encoding: "utf8",
    cwd: process.cwd(),
  }).trim();
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [epoch, ymd] = line.trim().split(" ");
    return { t: Number(epoch), day: ymd };
  });
}

/** Next calendar day YYYY-MM-DD (UTC date math, stable for ISO strings). */
function nextDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

/** Dates strictly between a and b (YYYY-MM-DD), exclusive. */
function daysStrictlyBetween(dayA, dayB) {
  if (!(dayA < dayB)) return [];
  const out = [];
  let cur = nextDay(dayA);
  while (cur < dayB) {
    out.push(cur);
    cur = nextDay(cur);
  }
  return out;
}

function main() {
  const commits = parseLines();
  if (commits.length === 0) {
    console.log("No commits.");
    return;
  }

  let summedShortGapsSec = 0;
  let longGaps = 0;
  const ignoredDays = new Set();

  for (let i = 1; i < commits.length; i++) {
    const dt = commits[i].t - commits[i - 1].t;
    if (dt <= MAX_GAP_SEC) {
      summedShortGapsSec += dt;
    } else {
      longGaps += 1;
      for (const d of daysStrictlyBetween(commits[i - 1].day, commits[i].day)) {
        ignoredDays.add(d);
      }
    }
  }

  const hoursShort = (summedShortGapsSec / 3600).toFixed(2);
  const sortedIgnored = [...ignoredDays].sort();

  console.log(JSON.stringify({
    rule: "Sum gap only if <= 3h; gaps > 3h add calendar days strictly between commit dates to ignoredDays",
    commitCount: commits.length,
    summedSessionHoursApprox: Number(hoursShort),
    summedSessionSeconds: summedShortGapsSec,
    gapsLongerThan3h: longGaps,
    ignoredCalendarDaysCount: sortedIgnored.length,
    ignoredCalendarDays: sortedIgnored,
  }, null, 2));
}

main();

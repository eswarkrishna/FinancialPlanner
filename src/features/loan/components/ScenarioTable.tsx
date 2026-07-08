import { type ScheduleRow } from "../../../lib/loan";
import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import { TableWrap } from "../../../components/TableWrap";

interface ScenarioTableProps {
  rows: ScheduleRow[];
  cashBalances?: number[];
  startDateIso?: string;
  locale?: Locale;
}

function calendarLabel(
  monthIndex: number,
  startDateIso?: string,
  locale: Locale = "IN",
): string | null {
  if (!startDateIso) return null;
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setMonth(d.getMonth() + monthIndex - 1);
  return d.toLocaleDateString(locale === "US" ? "en-US" : "en-IN", {
    year: "numeric",
    month: "short",
  });
}

export function ScenarioTable({
  rows,
  cashBalances,
  startDateIso,
  locale = "IN",
}: ScenarioTableProps) {
  const showCash = cashBalances !== undefined && cashBalances.length > 0;
  const showDate = Boolean(startDateIso);
  const money = (value: number) => formatMoney(value, locale);

  return (
    <TableWrap label="Loan amortisation schedule">
      <table className="schedule">
        <thead>
          <tr>
            <th>Month</th>
            {showDate && <th>Date</th>}
            <th>Opening</th>
            <th>Interest</th>
            <th>Principal (EMI)</th>
            <th>Prepay / extra</th>
            <th>Closing</th>
            {showCash && <th>Cash balance</th>}
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              {showDate && <td>{calendarLabel(row.month, startDateIso, locale) ?? "—"}</td>}
              <td>{money(row.opening_inr)}</td>
              <td>{money(row.interest_inr)}</td>
              <td>{money(row.principal_inr)}</td>
              <td>{row.prepayment_inr > 0 ? money(row.prepayment_inr) : "—"}</td>
              <td>{money(row.closing_inr)}</td>
              {showCash && (
                <td>
                  {cashBalances![i] !== undefined
                    ? money(cashBalances![i]!)
                    : "—"}
                </td>
              )}
              <td>{money(row.payment_inr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

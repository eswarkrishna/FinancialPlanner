import { type ScheduleRow } from "../../../lib/loan";
import { formatInr } from "../../../lib/formatInr";

interface ScenarioTableProps {
  rows: ScheduleRow[];
  cashBalances?: number[];
  startDateIso?: string;
}

function calendarLabel(monthIndex: number, startDateIso?: string): string | null {
  if (!startDateIso) return null;
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setMonth(d.getMonth() + monthIndex - 1);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short" });
}

export function ScenarioTable({ rows, cashBalances, startDateIso }: ScenarioTableProps) {
  const showCash = cashBalances !== undefined && cashBalances.length > 0;
  const showDate = Boolean(startDateIso);

  return (
    <div className="table-wrap">
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
              {showDate && <td>{calendarLabel(row.month, startDateIso) ?? "—"}</td>}
              <td>{formatInr(row.opening_inr)}</td>
              <td>{formatInr(row.interest_inr)}</td>
              <td>{formatInr(row.principal_inr)}</td>
              <td>{row.prepayment_inr > 0 ? formatInr(row.prepayment_inr) : "—"}</td>
              <td>{formatInr(row.closing_inr)}</td>
              {showCash && (
                <td>
                  {cashBalances![i] !== undefined
                    ? formatInr(cashBalances![i]!)
                    : "—"}
                </td>
              )}
              <td>{formatInr(row.payment_inr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

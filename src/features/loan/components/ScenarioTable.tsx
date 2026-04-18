import { type ScheduleRow } from "../../../lib/amortisation";
import { formatInr } from "../../../lib/formatInr";

export function ScenarioTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <div className="table-wrap">
      <table className="schedule">
        <thead>
          <tr>
            <th>Month</th>
            <th>Opening</th>
            <th>Interest</th>
            <th>Principal (EMI)</th>
            <th>Prepay / extra</th>
            <th>Closing</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{formatInr(row.opening_inr)}</td>
              <td>{formatInr(row.interest_inr)}</td>
              <td>{formatInr(row.principal_inr)}</td>
              <td>{row.prepayment_inr > 0 ? formatInr(row.prepayment_inr) : "—"}</td>
              <td>{formatInr(row.closing_inr)}</td>
              <td>{formatInr(row.payment_inr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

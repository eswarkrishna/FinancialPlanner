import { KpiStrip, type KpiItem } from "../../../components/KpiStrip";
import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import type { ComparisonRow } from "../hooks/loanModelTypes";
import type { ScenarioView } from "../hooks/loanModelTypes";

interface LoanKpiStripProps {
  locale: Locale;
  scenarioView: ScenarioView;
  comparisonRows: ComparisonRow[];
  activeWarnings: string[];
  emiLabel: string;
  emiValue: number;
}

function findRow(
  rows: ComparisonRow[],
  scenarioView: ScenarioView,
): ComparisonRow | undefined {
  return rows.find((row) => row.id === scenarioView);
}

export function LoanKpiStrip({
  locale,
  scenarioView,
  comparisonRows,
  activeWarnings,
  emiLabel,
  emiValue,
}: LoanKpiStripProps) {
  const money = (value: number) => formatMoney(value, locale);
  const activeRow = findRow(comparisonRows, scenarioView) ?? comparisonRows[0];
  if (!activeRow) return null;

  const isBaseline = scenarioView === "BASE";

  const items: KpiItem[] = [
    {
      id: "emi",
      label: emiLabel,
      value: money(emiValue),
    },
    {
      id: "payoff",
      label: "Payoff",
      value: activeRow.payoffMonth > 0 ? `${activeRow.payoffMonth} mo` : "—",
    },
    {
      id: "interest",
      label: "Total interest",
      value: money(activeRow.totalInterest),
    },
  ];

  if (!isBaseline) {
    items.push({
      id: "delta",
      label: "Interest saved vs baseline",
      value:
        activeRow.deltaInterestVsBase === 0
          ? "—"
          : money(activeRow.deltaInterestVsBase),
      tone: activeRow.deltaInterestVsBase > 0 ? "positive" : "default",
    });
  }

  if (
    activeRow.grossInterestSaved !== 0 ||
    activeRow.prepaymentFees !== 0
  ) {
    items.push({
      id: "gross-saved",
      label: "Gross interest saved",
      value: money(activeRow.grossInterestSaved),
      tone: activeRow.grossInterestSaved > 0 ? "positive" : "default",
    });
    items.push({
      id: "net-saved",
      label: "Net savings after fee",
      value: money(activeRow.netSavingsAfterFee),
      tone: activeRow.netSavingsAfterFee > 0 ? "positive" : "default",
    });
  }

  if (activeRow.minCashBalance !== undefined) {
    items.push({
      id: "min-cash",
      label: "Min cash",
      value: money(activeRow.minCashBalance),
      tone: activeRow.minCashBalance < 0 ? "danger" : "default",
    });
  }

  if (activeWarnings.length > 0) {
    items.push({
      id: "warnings",
      label: "Warnings",
      value: String(activeWarnings.length),
      tone: "warning",
    });
  }

  return <KpiStrip items={items} ariaLabel="Loan scenario summary" />;
}

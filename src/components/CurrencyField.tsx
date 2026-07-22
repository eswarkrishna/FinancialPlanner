import { useId } from "react";
import { formatMoneyEcho } from "../lib/locale/formatMoneyEcho";
import type { Locale } from "../lib/locale/types";

interface CurrencyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  hint?: string;
}

export function CurrencyField({
  label,
  value,
  onChange,
  locale,
  hint,
}: CurrencyFieldProps) {
  const inputId = useId();
  const parsed = Number(value);
  const echo =
    value.trim() !== "" && Number.isFinite(parsed) ? formatMoneyEcho(parsed, locale) : null;

  return (
    <div className="currency-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
      {echo ? (
        <span className="currency-echo" aria-live="polite">
          {echo}
        </span>
      ) : null}
    </div>
  );
}

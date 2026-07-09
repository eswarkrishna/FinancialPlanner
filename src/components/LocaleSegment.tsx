import type { Locale } from "../lib/locale/types";

const LOCALE_OPTIONS: { value: Locale; label: string; short: string }[] = [
  { value: "IN", label: "India (INR)", short: "IN" },
  { value: "US", label: "United States (USD)", short: "US" },
  { value: "UK", label: "United Kingdom (GBP)", short: "UK" },
];

interface LocaleSegmentProps {
  value: Locale;
  onChange: (next: Locale) => void;
}

export function LocaleSegment({ value, onChange }: LocaleSegmentProps) {
  return (
    <div className="locale-segment" role="radiogroup" aria-label="Country locale">
      {LOCALE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.label}
          className={`locale-segment-btn${
            value === option.value ? " locale-segment-btn--active" : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

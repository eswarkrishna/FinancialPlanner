import type { RetirementDisplayMode } from "../lib/retirement/display";

const DISPLAY_OPTIONS: { value: RetirementDisplayMode; label: string }[] = [
  { value: "nominal", label: "Nominal" },
  { value: "real", label: "Real (today)" },
];

interface RetirementDisplaySegmentProps {
  value: RetirementDisplayMode;
  onChange: (next: RetirementDisplayMode) => void;
}

export function RetirementDisplaySegment({
  value,
  onChange,
}: RetirementDisplaySegmentProps) {
  return (
    <div
      className="locale-segment"
      role="radiogroup"
      aria-label="Retirement corpus display mode"
    >
      {DISPLAY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`locale-segment-btn${
            value === option.value ? " locale-segment-btn--active" : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

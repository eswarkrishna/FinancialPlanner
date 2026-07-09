import type { ScenarioView } from "../../../lib/loan/scenarioViews";
import type { ScenarioViewOption } from "../hooks/buildScenarioViewOptions";

interface ScenarioCardPickerProps {
  options: ScenarioViewOption[];
  value: ScenarioView;
  onChange: (next: ScenarioView) => void;
}

export function ScenarioCardPicker({
  options,
  value,
  onChange,
}: ScenarioCardPickerProps) {
  return (
    <div className="scenario-cards" role="radiogroup" aria-label="Schedule scenario">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${option.label}: ${option.subtitle}`}
            className={`scenario-card${active ? " scenario-card--active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className="scenario-card-title">{option.label}</span>
            <span className="scenario-card-sub">{option.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}

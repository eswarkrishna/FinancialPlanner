import { useId, useState, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  hint?: string;
}

export function FormSection({
  title,
  children,
  defaultOpen = true,
  hint,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  return (
    <section className="form-section">
      <h3 className="form-section-head">
        <button
          type="button"
          id={buttonId}
          className="form-section-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="form-section-chevron" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
          {title}
        </button>
      </h3>
      {hint && open ? <p className="hint form-section-hint">{hint}</p> : null}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="form-section-panel"
      >
        {children}
      </div>
    </section>
  );
}

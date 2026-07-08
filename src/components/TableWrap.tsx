import type { ReactNode } from "react";

interface TableWrapProps {
  children: ReactNode;
  /** Accessible name for the scrollable table region. */
  label: string;
  className?: string;
}

/**
 * Keyboard-focusable wrapper for horizontally/vertically scrollable data tables.
 */
export function TableWrap({ children, label, className }: TableWrapProps) {
  const classes = ["table-wrap", className].filter(Boolean).join(" ");
  return (
    <div className={classes} tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { LocaleProvider } from "../features/locale/LocaleContext";

export function renderWithLocale(ui: ReactElement, options?: RenderOptions) {
  return render(<LocaleProvider>{ui}</LocaleProvider>, options);
}

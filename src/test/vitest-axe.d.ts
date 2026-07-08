import type { AxeResults } from "vitest-axe";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T extends AxeResults ? void : never;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

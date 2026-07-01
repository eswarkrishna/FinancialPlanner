import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "../test/renderWithLocale";
import { AppFooter } from "./AppFooter";

describe("AppFooter feedback form", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows embedded form when VITE_FEEDBACK_FORM_URL is set", () => {
    vi.stubEnv(
      "VITE_FEEDBACK_FORM_URL",
      "https://docs.google.com/forms/d/e/test/viewform?embedded=true",
    );

    renderWithLocale(<AppFooter />);

    expect(screen.getByRole("link", { name: "Open feedback form" })).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/test/viewform?embedded=true",
    );
    expect(screen.getByTitle("Feedback form")).toHaveAttribute(
      "src",
      "https://docs.google.com/forms/d/e/test/viewform?embedded=true",
    );
    expect(screen.getByText("Send feedback via form")).toBeInTheDocument();
  });
});

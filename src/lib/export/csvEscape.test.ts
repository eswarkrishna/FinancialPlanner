import { describe, expect, it } from "vitest";
import { escapeCsvCell, neutralizeCsvFormula } from "./csvEscape";

describe("csvEscape (security)", () => {
  it("prefixes formula cells with a single quote", () => {
    expect(neutralizeCsvFormula("=HYPERLINK(\"http://evil\")")).toBe(
      "'=HYPERLINK(\"http://evil\")",
    );
    expect(neutralizeCsvFormula("+cmd|'/c calc'!A0")).toBe("'+cmd|'/c calc'!A0");
    expect(neutralizeCsvFormula("-10+20")).toBe("'-10+20");
    expect(neutralizeCsvFormula("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("leaves safe labels unchanged", () => {
    expect(neutralizeCsvFormula("Rent")).toBe("Rent");
    expect(neutralizeCsvFormula("1000")).toBe("1000");
  });

  it("quotes commas and escapes embedded quotes", () => {
    expect(escapeCsvCell('Say "hi", friend')).toBe('"Say ""hi"", friend"');
  });

  it("neutralizes formulas before quoting", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });
});

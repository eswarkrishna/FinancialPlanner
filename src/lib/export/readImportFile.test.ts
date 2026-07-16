import { describe, expect, it } from "vitest";
import {
  ImportFileTooLargeError,
  MAX_IMPORT_FILE_BYTES,
  readImportTextFile,
} from "./readImportFile";

describe("readImportTextFile", () => {
  it("rejects files larger than the cap", async () => {
    const huge = new File(["x"], "big.json", {
      type: "application/json",
    });
    Object.defineProperty(huge, "size", { value: MAX_IMPORT_FILE_BYTES + 1 });

    await expect(readImportTextFile(huge)).rejects.toBeInstanceOf(ImportFileTooLargeError);
  });

  it("reads small text files", async () => {
    const file = new File(['{"ok":true}'], "ok.json", { type: "application/json" });
    await expect(readImportTextFile(file)).resolves.toBe('{"ok":true}');
  });
});

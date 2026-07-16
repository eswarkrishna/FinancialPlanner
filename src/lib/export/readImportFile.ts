/** Maximum JSON import file size (5 MB). */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export const IMPORT_FILE_TOO_LARGE_MESSAGE =
  "File is too large. Imports are limited to 5 MB.";

export class ImportFileTooLargeError extends Error {
  constructor() {
    super(IMPORT_FILE_TOO_LARGE_MESSAGE);
    this.name = "ImportFileTooLargeError";
  }
}

/** Read a text import file with a size cap before parsing. */
export async function readImportTextFile(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new ImportFileTooLargeError();
  }
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

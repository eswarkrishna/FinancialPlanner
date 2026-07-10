import puppeteer, { type Browser, type Page } from "puppeteer";

export interface BrowserSession {
  browser: Browser;
  page: Page;
  close: () => Promise<void>;
}

export async function launchBrowser(): Promise<BrowserSession> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 60_000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  return {
    browser,
    page,
    close: async () => {
      await browser.close();
    },
  };
}

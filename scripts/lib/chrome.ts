import { existsSync } from "node:fs";

/**
 * PDF export uses puppeteer-core against a locally installed Chrome/Chromium
 * instead of bundling a downloaded browser, keeping the dependency install
 * lightweight. Users can override detection with PUPPETEER_EXECUTABLE_PATH
 * or CHROME_PATH.
 */
const CANDIDATE_PATHS: string[] = [
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Linux
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

export class ChromeNotFoundError extends Error {
  constructor() {
    super(
      "Could not find a local Chrome/Chromium install for PDF export. " +
        "Install Google Chrome, or set PUPPETEER_EXECUTABLE_PATH (or CHROME_PATH) " +
        "to the path of a Chromium-based browser executable.",
    );
    this.name = "ChromeNotFoundError";
  }
}

export function findChromeExecutable(): string {
  const override = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_PATH;
  if (override) {
    if (!existsSync(override)) {
      throw new Error(`PUPPETEER_EXECUTABLE_PATH/CHROME_PATH does not exist: ${override}`);
    }
    return override;
  }

  const found = CANDIDATE_PATHS.find((path) => existsSync(path));
  if (!found) {
    throw new ChromeNotFoundError();
  }
  return found;
}

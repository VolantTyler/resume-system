import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import puppeteer from "puppeteer-core";
import { findChromeExecutable } from "./chrome.js";

/**
 * Renders already-generated, print-ready résumé HTML to a PDF using a
 * headless local Chrome instance. The HTML's own `@media print` styles are
 * the source of truth for layout — this just drives the browser's print
 * pipeline against them.
 */
export async function renderHtmlToPdf(html: string, outputPath: string): Promise<void> {
  mkdirSync(dirname(outputPath), { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: findChromeExecutable(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");
    await page.pdf({
      path: outputPath,
      printBackground: true,
      // The template's `@media print` CSS defines its own `@page` size and
      // margins, so let that be the source of truth instead of Puppeteer's.
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}

// Versio 4
// src/v4/engines/CrawlerBase.ts
import { chromium, Browser } from "playwright";
import { JSDOM } from "jsdom";
import { EngineBase } from "../EngineBase";
import Logger from "../../utils/logger";

const logger = Logger.get();

/**
 * CrawlerBase
 * -----------
 * Classe base per a motors de tipus "crawler".
 * Gestiona la part comuna: arrencar navegador, obtenir HTML i parsejar-lo.
 */
export abstract class CrawlerBase extends EngineBase {
  protected abstract source: string; // ex. "wikipedia"
  protected browser: Browser | null = null;

  /**
   * Llença Chromium (via Playwright) segons configuració.
   */
  protected async launchBrowser(headed = false): Promise<Browser> {
    logger.debug(`[${this.source}] Launching browser (headed=${headed})`);
    this.browser = await chromium.launch({ headless: !headed });
    return this.browser;
  }

  /**
   * Tanca el navegador si està obert.
   */
  protected async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.debug(`[${this.source}] Browser closed`);
    }
  }

  /**
   * Obté el DOM d’una URL amb Playwright i JSDOM.
   * @param url URL a visitar
   */
  protected async fetchDOM(url: string, headed = false): Promise<Document> {
    const browser = await this.launchBrowser(headed);
    const context = await browser.newContext();
    const page = await context.newPage();

    logger.debug(`[${this.source}] Visiting ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    const html = await page.content();
    await page.close();
    await this.closeBrowser();

    const dom = new JSDOM(html, { url });
    return dom.window.document;
  }

  /**
   * Cada crawler concret ha d’implementar com processa els seeds.
   */
  abstract runFromCLI(): Promise<void>;
}

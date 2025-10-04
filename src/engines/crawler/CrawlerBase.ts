// src/v4/engines/CrawlerBase.ts
import { chromium, Browser, Page } from "playwright";
import { JSDOM } from "jsdom";
import { EngineBase } from "@/engines/EngineBase";
import Logger from "@/utils/logger";

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
   * Inicialitza el navegador si encara no està obert.
   */
  protected async initBrowser(headed = false): Promise<void> {
    if (!this.browser) {
      logger.debug(`[${this.source}] Launching browser (headed=${headed})`);
      this.browser = await chromium.launch({ headless: !headed });
    }
  }

  /**
   * Tanca el navegador si està obert.
   */
  async disposeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.debug(`[${this.source}] Browser closed`);
    }
  }

  /**
   * Helper per obrir i tancar una pàgina amb seguretat.
   */
  protected async withPage<T>(
    fn: (page: Page) => Promise<T>,
    headed = false
  ): Promise<T> {
    await this.initBrowser(headed);
    const context = await this.browser!.newContext();
    const page = await context.newPage();

    try {
      return await fn(page);
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  /**
   * Obté el DOM d’una URL amb Playwright i JSDOM.
   * @param url URL a visitar
   */
  protected async fetchDOM(url: string, headed = false): Promise<Document> {
    const html = await this.retry( async () =>
      this.withPage(async (page) => {
        logger.debug(`[${this.source}] Visiting ${url}`);
        await page.goto(url, { waitUntil: "networkidle" });
        return page.content();
      }, headed)
    )

    const dom = new JSDOM(html, { url });
    return dom.window.document;
  }
  /**
   * Retry helper with exponential backoff + jitter.
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 300,
    timeoutMs = 10000
  ): Promise<T> {
    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= maxRetries) {
      try {
        // enforce timeout per attempt
        const result = await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          ),
        ]);
        return result;
      } catch (err) {
        lastErr = err;
        attempt++;
        if (attempt > maxRetries) break;

        const delay = Math.min(5000, baseDelayMs * 2 ** (attempt - 1));
        const jitter = Math.floor(Math.random() * (delay / 3));
        logger.warn(
          `[${this.source}] Retry ${attempt}/${maxRetries} after error: ${String(
            err
          )} – waiting ${delay + jitter}ms`
        );
        await new Promise((r) => setTimeout(r, delay + jitter));
      }
    }

    throw lastErr;
  }

  /**
   * Cada crawler concret ha d’implementar com processa els seeds.
   */
  abstract runFromCLI(): Promise<void>;
}

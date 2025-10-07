 // src/engines/WikipediaCrawler.ts
import { ConfigManager, AppConfig } from "@/config.js"

import { CrawlerBase } from "@/engines/crawler/CrawlerBase.js";
import { extractPotentialNamesFromHTML } from "@/engines/utils/nameExtractor.js";
import { inferGenderFromNameList } from "@/engines/utils/genderInference.js";
import { slugify } from "@/utils/slug.js";
import Logger from "@/utils/logger.js";
import fs from "fs";
import path from "path";

const logger = Logger.get();

interface PageMetadata {
  locale: string;
  gender: string;
  source_url: string;
  source_slug: string;
}

/**
 * WikipediaCrawler
 * ----------------
 * Crawler especialitzat per a categories de noms a Wikipedia/Wiktionary.
 */
export class WikipediaCrawler extends CrawlerBase {
  protected source = "wikipedia";
  constructor() {
    super()
  }

  static async runFromConfig(config: AppConfig): Promise<void> {
    const crawler = new WikipediaCrawler();
    
    try {
      await crawler.runFromCLI();
    } finally {
      // If the crawler/base provides a browser disposer, call it safely
      crawler.disposeBrowser()
      // const maybeDispose = (crawler as any).closeBrowser;
      // if (typeof maybeDispose === "function") {
      //   await maybeDispose.call(crawler);
      // }
    }
  }
  
  /**
   * Executa el crawler des de CLI segons la configuració.
   */
  async runFromCLI(): Promise<void> {
    const seedsFile = this.config.seedsFile ??  this.config.crawler.defSeed;
    if (!seedsFile) {
      throw new Error("[WikipediaCrawler] No seed file provided");
    }

    logger.info(`[WikipediaCrawler] Using seeds file: ${seedsFile}`);

    const seedsPath = path.resolve(this.config.paths.seeds , seedsFile);

    const content = fs.readFileSync(seedsPath, "utf-8");
    const seeds = content.split("\n").filter(Boolean);

    const maxPages = this.config.crawler.maxPages || seeds.length;
    let processed = 0;

    for (const seed of seeds) {
      if (processed >= maxPages) break;

      try {
        const { names, metadata } = await this.extractNamesFromPage(seed);
        this.saveResults(
          `${metadata.locale}-${metadata.gender}-${metadata.source_slug}`,
          names,
          metadata
        );
        processed++;
      } catch (err) {
        logger.error(`[WikipediaCrawler] Error crawling ${seed}`, err);
      }
    }

    logger.info(`[WikipediaCrawler] Finished. Processed ${processed} pages.`);
  }

  /**
   * Extreu noms i metadades d’una pàgina de Wikipedia.
   */
  private async extractNamesFromPage(
    url: string
  ): Promise<{ names: string[]; metadata: PageMetadata }> {
    const document = await this.fetchDOM(
      url,
      this.config.crawler.headed || false
    );

    const candidates = extractPotentialNamesFromHTML(document);
    const validNames = this.filterNames(candidates);
    const metadata = this.buildMetadata(url,validNames)

    return { names: validNames, metadata };
  }

  /**
   * Pas 2: filtrar noms candidats (ara mateix només retorna els mateixos).
   * Aquí s’hi poden afegir regles de llargada, caràcters, blacklist, etc.
   */
  protected filterNames(candidates: string[]): string[] {
    return candidates;
  }  
  /**
   * Pas 3: construir objecte de metadades coherent.
   */
  protected buildMetadata(url: string, names: string[]): PageMetadata {
    const inferredGender = inferGenderFromNameList(names, "unknown").gender;
    return {
      locale: this.config.locale || "unknown",
      gender: inferredGender,
      source_url: url,
      source_slug: slugify(url),
    };
  }
  
}

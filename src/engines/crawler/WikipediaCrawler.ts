// Versio 4
// src/v4/engines/WikipediaCrawler.ts
import { CrawlerBase } from "./CrawlerBase";
import { extractPotentialNamesFromHTML } from "../utils/nameExtractor";
import { inferGenderFromNameList } from "../utils/genderInference";
import { slugify } from "../../utils/slug";
import Logger from "../../utils/logger";
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

    const content = require("fs").readFileSync(seedsPath, "utf-8");
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

    const validNames = extractPotentialNamesFromHTML(document);

    // Inferim el gènere a partir dels noms si no ve del seed
    const inferredGender = inferGenderFromNameList(validNames, "unknown").gender;

    const meta: PageMetadata = {
      locale: this.config.locale || "unknown",
      gender: inferredGender,
      source_url: url,
      source_slug: slugify(url),
    };

    return { names: validNames, metadata: meta };
  }
}

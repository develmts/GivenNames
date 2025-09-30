// src/v4/engines/GenericCrawler.ts
import fs from "fs";
import path from "path";
import { CrawlerBase } from "./CrawlerBase";
import { extractPotentialNamesFromHTML } from "../utils/nameExtractor";
import { inferGenderFromNameList } from "../utils/genderInference";
import { slugify } from "../../utils/slug";
import Logger from "../../utils/logger";

const logger = Logger.get();

interface PageMetadata {
  locale: string;
  gender: string;
  source_url: string;
  source_slug: string;
}

/**
 * GenericCrawler
 * --------------
 * Versió genèrica del crawler: extreu noms d’una llista HTML
 * sense regles específiques (com les de Wikipedia).
 */
export class GenericCrawler extends CrawlerBase {
  protected source = "generic";

  async runFromCLI(): Promise<void> {
    const seedsFile = this.config.seedsFile ?? this.config.crawler.defSeed;
    const seedsPath = path.resolve(this.config.paths.seeds, seedsFile);

    if (!fs.existsSync(seedsPath)) {
      throw new Error(`[GenericCrawler] Seeds file not found: ${seedsPath}`);
    }

    logger.info(`[GenericCrawler] Using seeds file: ${seedsPath}`);
    const content = fs.readFileSync(seedsPath, "utf-8");
    const seeds = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    const maxPages = this.config.crawler.maxPages ?? seeds.length;
    let processed = 0;

    for (const url of seeds) {
      if (processed >= maxPages) break;
      try {
        const { names, metadata } = await this.extractNamesFromPage(url);
        this.saveResults(
          `${metadata.locale}-${metadata.gender}-${metadata.source_slug}`,
          names,
          metadata
        );
        processed++;
      } catch (err) {
        logger.error(`[GenericCrawler] Error crawling ${url}`, err);
      }
    }

    logger.info(`[GenericCrawler] Finished. Processed ${processed} pages.`);
  }

  private async extractNamesFromPage(
    url: string
  ): Promise<{ names: string[]; metadata: PageMetadata }> {
    const document = await this.fetchDOM(
      url,
      this.config.crawler.headed || false
    );

    // 🔹 Per defecte: mirar text de <li> i <p>
    const candidates = Array.from(
      document.querySelectorAll("li, p")
    ).map(el => el.textContent?.trim() || "");

    const validNames = extractPotentialNamesFromHTML(document)
      .concat(candidates)
      .filter(Boolean);

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

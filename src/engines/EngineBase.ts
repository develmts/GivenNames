// src/v4/engines/EngineBase.ts
import fs from "fs";
import path from "path";
import { ConfigManager } from "@/config.js";
import Logger from "@/utils/logger.js";
import { slugify } from "@/utils/slug.js";

const logger = Logger.get();

/**
 * EngineBase
 * -----------
 * Classe base per a tots els "engines" (crawlers, query managers...).
 * Defineix la interfície comuna i la utilitat de guardar resultats.
 */
export abstract class EngineBase {
  protected config = ConfigManager.config();
  protected abstract source: string; // "wikipedia", "wikidata", etc.

  /**
   * Cada engine ha d'implementar com s'executa des del CLI.
   */
  abstract runFromCLI(): Promise<void>;

  /**
   * Guarda els resultats en un fitxer dins de data/raw.
   * @param fileStem Nom base de l'arxiu (sense extensió)
   * @param names Llista de noms trobats
   * @param metadata Informació addicional (locale, gender, url, etc.)
   */
  protected saveResults(fileStem: string, names: string[], metadata: Record<string, any>) {
    const rawPath = path.resolve(__dirname, "../../data/raw");
    if (!fs.existsSync(rawPath)) {
      throw new Error(`Raw data path not found: ${rawPath}`);
    }

    const safeStem = slugify(fileStem);
    const filePath = path.join(rawPath, `${safeStem}.txt`);

    const header = [
      `# source=${this.source}`,
      ...Object.entries(metadata).map(([k, v]) => `# ${k}=${v}`)
    ].join(" ");

    const content = `${header}\n${names.join("\n")}\n`;
    fs.writeFileSync(filePath, content, { encoding: "utf-8" });

    logger.info(`[${this.source}] Saved ${names.length} names → ${filePath}`);
  }
}

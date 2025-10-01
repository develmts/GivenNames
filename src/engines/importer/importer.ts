
// importer.ts
// Versio 5.0

import fs from "fs";
import path from "path";
import readline from "readline";
import {AppConfig, ConfigManager } from "@/config";
// import { GivenNamesORM } from "./db/GivenNamesORM";
import { NameService } from "@/services/NameService";

import Logger from "@/utils/logger";

const logger = Logger.get()


interface ImportEntry {
  name: string;
  gender: string;
  locale: string;
  source: string;
  timestamp?: string;
}

/**
 * Importer class
 * --------------
 * V4: imports names into the database from different sources.
 * Default source: raw files produced by the crawler.
 * Future sources: other databases, APIs, etc.
 */
export class Importer {
  protected config = ConfigManager.config();
  // private orm: GivenNamesORM;
  private nameService: NameService;

  // constructor(config: AppConfig) {
  //   this.config = config;
  //   this.orm = new GivenNamesORM(config);
  // }
  constructor() {
    this.nameService = new NameService(); // s’autoinicialitza amb ORM i serveis interns
  }

  /**
   * Entrypoint for CLI
   */
  static async runFromConfig(config: AppConfig) : Promise<void>  {
    const importer = new Importer();
    await importer.run();
  }
  
  /**
   * Main import workflow
   */
 
  async run(): Promise<void> {
    const rawDir = this.config.paths.raw;
    const files = fs.readdirSync(rawDir).filter(f => f.endsWith(".txt"));

    if (files.length === 0) {
      console.warn("[importer] No .txt files found in", rawDir);
      return;
    }

    for (const file of files) {
      const filePath = path.join(rawDir, file);
      await this.importFile(filePath);
    }
  }
  

private async importFile(filePath: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath, "utf-8");
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let meta: {
      locale: string;
      gender: string;
      source: string;
      timestamp: string;
    } = {
      locale: "unknown",
      gender: "u",
      source: "",
      timestamp: new Date().toISOString(),
    };

    let names: string[] = [];
    let lineNo = 0;

    for await (const lineRaw of rl) {
      const line = lineRaw.trim();
      lineNo++;

      // --------------------------
      // Header
      // --------------------------
      if (line.startsWith("#")) {
        if (lineNo === 1) {
          // primera línia amb metadata principal
          const metaMatch = line.match(
            /locale=(\S+)\s+gender=(\S+)\s+source=(\S+)/
          );
          if (metaMatch) {
            meta.locale = metaMatch[1];
            meta.gender = metaMatch[2];
            meta.source = metaMatch[3];
          }
        }
        if (lineNo === 2 && line.includes("timestamp=")) {
          const tsMatch = line.match(/timestamp=(\S+)/);
          if (tsMatch) {
            meta.timestamp = tsMatch[1];
          }
        }
        continue;
      }

      if (!line) continue; // buida

      names.push(line);
    }

    // --- Inserir o simular ---
    const inserted = await this.nameService.insertBatch(names, meta);

    console.log(
      `[importer] File=${path.basename(filePath)} Inserted=${inserted}` +
        (this.config.importer.dryRun ? " (dry-run mode)" : "")
    );
  }
  
}



// src/v4/config.ts
/**
 * Global configuration for GivenNames
 * - Sources: CLI (--flag), .env, defaults
 * - Priority: CLI > ENV > defaults
 * - Exports immutable `config`
 */

import minimist from "minimist";
import dotenv from "dotenv";
import path from "path";

dotenv.config({quiet:true});
const argv = minimist(process.argv.slice(2));

// Helpers
const asBool = (v: any, fb: boolean) =>
  v === undefined || v === null ? fb :
  typeof v === "boolean" ? v :
  typeof v === "number" ? v !== 0 :
  typeof v === "string" ? ["true","1","yes","on"].includes(v.trim().toLowerCase()) :
  fb;

const asInt = (v: any, fb: number) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fb;
};

export interface ServerConfig {
  port: number
  useTLS: boolean
  tlsKey?: string
  tlsCert?: string
}

export interface AppConfig {
  // Arrel de càlcul de rutes
  rootPath: string;

  // General
  verbose: boolean;
  locale: string;

  // Paths (DIRECTORIS, relatius a rootPath quan venen de config)
  paths: {
    seeds: string;
    raw: string;
    sources: string;
    sql: string;
  };

  // Fitxer de seeds a usar (OPCIONAL): només el NOM dins de paths.sources
  seedsFile: string | null;
  
  // sparql config
  sparql: {               // 👈 afegim nova secció
    rateLimitMs: number;  // delay entre consultes
  };


  // DB
  db: {
    driver: "sqlite" | "postgres" | "mysql";
    file: string;     // absolute (normalitzed)
    url?: string;
    schemaFile: string; 
  };

  // Crawler
  crawler: {
    userAgent: string;
    timeoutMs: number;
    maxRetries: number;
    delayMs: number;
    defSeed: string;   // nom per defecte (sense path)
    maxPages: number;  // 0 = il·limitat
    headed: boolean;   // Playwright UI (true) o headless (false)
  };

  // Importer
  importer: {
    batchSize: number;
    skipDuplicates: boolean;
    dryRun: boolean;  
  };

  // Clustering
  clustering: {
    enabled: boolean;
    method:  "embeddings" | "wikidata";
  };

  server: ServerConfig
}

// Defaults (relatius; es normalitzen contra rootPath en el get())
const defaults = {
  verbose: false,
  locale: "en-US",
  paths: {
    seeds: "data/sources/",
    raw: "data/raw/",
    sources: "data/sources/",
    sql: "data/sql/",
  },

  seedsFile: null as string | null,
  sparql: {
    rateLimitMs:  1000, // 👈 per CLI --rateLimit=2000
  },

  db: {
    driver: "sqlite" as const,
    file: "data/db/givennames_v4.sqlite",
    url: undefined as string | undefined,
    schemaFile: "data/sql/schema_givennames-normalized_v4.sql"
  },

  crawler: {
    userAgent: "GivenNamesBot/4.0 (+https://example.org/bot)",
    timeoutMs: 15000,
    maxRetries: 3,
    delayMs: 0,
    defSeed: "default.txt",
    maxPages: 0,
    headed: false,
  },

  importer: {
    batchSize: 500,
    skipDuplicates: true,
    dryRun: false,
  },

  clustering: {
    enabled: false,
    method: "embeddings" as const,
  },
};

// Root path “latched” la primera vegada
// DEPRECATED: ara es passa la primera vegada a config()
// i es guarda en la instància singleton
// let ROOT_PATH: string | null = null;

function buildConfig(rootPath: string): AppConfig {
  // merge CLI > ENV > defaults (valors RELATIUS encara)
  // seeds and sources apoints to same dir beacuse , in fact, a seed its also a "source"
  //
  // ⚠️ Note:
  // If relPaths.X is already an absolute path (e.g. /tmp/data),
  // path.resolve(rootPath, relPaths.X) will return the absolute value
  // and IGNORE rootPath entirely.
  // This is native Node.js behavior and can be useful, but it also means
  // the assumption "all paths are relative to rootPath" may not always hold.
  const relPaths = {
    seeds: process.env.PATH_SEEDS_DIR ?? defaults.paths.sources ?? "data/sources/",
    raw: process.env.PATH_RAW ?? defaults.paths.raw ?? "data/raw/",
    sources: process.env.PATH_SOURCES ?? defaults.paths.sources ?? "data/sources/",
    sql: process.env.PATH_SQL ?? defaults.paths.sql ?? "data/sql/",
  };

  const seedsFileRaw =
    (argv.seeds as string | undefined) ??
    (process.env.SEEDS_FILE as string | undefined) ??
    defaults.seedsFile;

  const cfg: AppConfig = {
    rootPath,

    verbose: (argv.verbose as boolean | undefined) ?? asBool(process.env.VERBOSE, defaults.verbose),
    locale: (argv.locale as string | undefined) ?? process.env.LOCALE ?? defaults.locale,

    paths: {
      seeds: path.resolve(rootPath, relPaths.seeds),
      raw: path.resolve(rootPath, relPaths.raw),
      sources: path.resolve(rootPath, relPaths.sources),
      sql: path.resolve(rootPath, relPaths.sql),
    },

    // Nom del fitxer dins de seeds/ (si ve amb path, ens quedem només el basename)
    seedsFile: seedsFileRaw ? path.basename(seedsFileRaw) : null,
    sparql: {
      rateLimitMs: argv.rateLimit ? Number(argv.rateLimit) :defaults.sparql.rateLimitMs, // 👈 per CLI --rateLimit=2000
    },
    db: {
      driver: (process.env.DB_DRIVER as "sqlite" | "postgres" | "mysql") ?? defaults.db.driver,
      file: path.resolve(rootPath, process.env.DB_FILE ?? defaults.db.file),
      url: process.env.DB_URL ?? defaults.db.url,
      schemaFile: path.resolve(rootPath, defaults.db.schemaFile),
    },

    crawler: {
      userAgent: process.env.CRAWLER_UA ?? defaults.crawler.userAgent,
      timeoutMs: asInt(process.env.CRAWLER_TIMEOUT, defaults.crawler.timeoutMs),
      maxRetries: asInt(process.env.CRAWLER_RETRIES, defaults.crawler.maxRetries),
      delayMs: asInt(process.env.CRAWLER_DELAY, defaults.crawler.delayMs),

      defSeed:
        (argv.defSeed as string | undefined) ??
        process.env.CRAWLER_DEF_SEED ??
        process.env.DEF_SEED ??
        defaults.crawler.defSeed,

      maxPages: asInt((argv.maxPages as any) ?? process.env.CRAWLER_MAX_PAGES, defaults.crawler.maxPages),
      headed: asBool((argv.headed as any) ?? process.env.CRAWLER_HEADED, defaults.crawler.headed),
    },

    importer: {
      batchSize: asInt(process.env.IMPORTER_BATCH, defaults.importer.batchSize),
      // ⚠️ Note:
      // `skipDuplicates` and `dryRun` are conceptually different:
      // - skipDuplicates = do not import names that already exist in the database.
      // - dryRun        = simulate the import process without writing anything to the database.
      // Keep them as separate flags, even if they may look similar at first glance.
      skipDuplicates: asBool(process.env.IMPORTER_SKIP_DUPLICATES, defaults.importer.skipDuplicates),
      dryRun: asBool((argv.dryrun as any) ?? process.env.IMPORTER_DRY_RUN, defaults.importer.skipDuplicates),
    },

    clustering: {
      enabled: asBool(process.env.CLUSTERING_ENABLED, defaults.clustering.enabled),
      method: (process.env.CLUSTERING_METHOD as "embeddings" | "wikidata") ?? defaults.clustering.method,
    },

    server: {
      port: parseInt(process.env.API_PORT || "3000", 10),
      useTLS: process.env.USE_TLS === "true",
      tlsKey: process.env.TLS_KEY,
      tlsCert: process.env.TLS_CERT
    },
  };

  return cfg;
}

/**
 * Proveïdor de config: fixa rootPath la primera vegada i retorna una config congelada.
 * - Truca-ho des d’`app.ts` com:  const config = Appconfig.get(process.cwd());
 * - En crides posteriors, el `rootPath` queda invariable (ignora paràmetres nous).
 */

export class ConfigManager {
  private static instance: Readonly<AppConfig>;

  static config(rootPath?: string): Readonly<AppConfig> {
    if (!ConfigManager.instance) {
      if (!rootPath) {
        throw new Error("[ConfigManager] rootPath is required on first call to ConfigManager.config()");
      }
      ConfigManager.instance = Object.freeze(buildConfig(rootPath));
    }
    return ConfigManager.instance;
  }
}
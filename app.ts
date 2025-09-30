/**
 * App dispatcher (antic index.ts de v5)
 * - No parseja argv (ja ho fa config.ts)
 * - Rep un AppConfig amb rootPath fixat
 */
import { AppConfig, ConfigManager } from "./src/v5/config";
import Logger from "./src/v5/utils/logger";
import { Crawler } from "./src/v5/oldcrawler";
import { Importer } from "./src/v5/engines/importer/importer";
import { GivenNamesORM } from "./src/v5/orm/GivenNamesORM";
import {semImport } from "./src/v5/engines/utils/importSemantic"

import { createHttpTerminator, HttpTerminator } from "http-terminator"
import { readFileSync } from "fs";

// Estableix rootPath (només la 1a vegada)
const config = ConfigManager.config(process.cwd())
const orm = GivenNamesORM.connect(config.db.file);
let terminator: HttpTerminator | null = null

// Handler global → accessible sempre
const shutdown = async () => {
  const logger = Logger.get()
  logger.info("Shutting down gracefully...")

  try {
    if (terminator) {
      await terminator.terminate()
      logger.info("HTTP server terminated")
    }
    orm.close()
    logger.info("ORM connection closed")
  } catch (err) {
    logger.error("Error during shutdown", err)
  } finally {
    process.exit(0)
  }
}


// Handlers globals → out of main()
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)


process.on("uncaughtException", (err) => {
  Logger.get().error("Uncaught Exception", err);
  process.exitCode = 1;
});

process.on("unhandledRejection", (reason) => {
  Logger.get().error("Unhandled Rejection", reason);
  process.exitCode = 1;
});

export async function main() {
  const logger=Logger.init(config); // activa verbose si cal
  logger.info("App started");

  const command = process.argv[2];

  if (config.verbose) {
    console.log(`[app] rootPath = ${config.rootPath}`);
    console.log(`[index] Starting with command="${command}"`);
    // console.log(`[index] Effective config:`, JSON.stringify(config, null, 2));
  }

  switch (command) {
    case "crawl":
      await Crawler.runFromConfig(config);
      break;
    case "import":
      await Importer.runFromConfig(config);
      break;
    case "testdb":
      orm.testConnection();
      orm.close()
      break;
    case "semantics":
      semImport(config.rootPath);
      break;
    case "start":
      //Start API Server
      console.log("Starting GivenNames API server...");
      const { serve } = await import("@hono/node-server")
      const serverModule = await import("./src/v5/server")

      const port = config.server.port || 3000
      let  httpServer  //= serve({ fetch: serverModule.default.fetch, port })
      if (config.server.useTLS) {
        httpServer = serve({
          fetch: serverModule.default.fetch,
          port,
          tls: {
            key: readFileSync(config.server.tlsKey!),
            cert: readFileSync(config.server.tlsCert!)
          },
        } as any)
        logger.info(`HTTPS server listening on https://localhost:${port}`)
      } else {
        httpServer = serve({ fetch: serverModule.default.fetch, port })
        logger.info(`HTTP server listening on http://localhost:${port}`)
      }

      terminator = createHttpTerminator({ server: httpServer })
      break
    case "help":
    default:
      console.error("Usage: app <command>");
      console.error("Commands:");
      console.error("  crawl    Run the webcrawler");
      console.error("  import   Import results into DB");
      console.error("  start    Start the API server");
  }
}

main()


/**
 * App dispatcher (antic index.ts de versio 5)
 * - No parseja argv (ja ho fa config.ts)
 * - Rep un AppConfig amb rootPath fixat
 */
import { AppConfig, ConfigManager } from "@/config.js";

import Logger from "@/utils/logger.js";
const logger = Logger.get()

import { WikipediaCrawler as Crawler} from "@/engines/crawler/WikipediaCrawler.js"  //oldcrawler";
import { Importer } from "@/engines/importer/importer.js";
import { GivenNamesORM } from "@/orm/GivenNamesORM.js";
import { semImport } from "@/engines/utils/importSemantic.js"

import { createHttpTerminator, HttpTerminator } from "http-terminator"
import { readFileSync } from "fs";
import { server } from "@/server.js";

// Estableix rootPath (només la 1a vegada)
const config = ConfigManager.config(process.cwd())

const orm = GivenNamesORM.connect(config.db.file);
let terminator: HttpTerminator | null = null
let isShuttingDown: boolean = false

// Handler global → accessible sempre
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info("Shutting down gracefully...")

  try {
    // if (terminator) {
    //   await terminator.terminate().catch((e) => logger.warn(`HTTP terminator Error ${e.toString()}`))
    //   logger.info("HTTP server terminated")
    // }
    await server.shutdown()
    await orm.close()
    logger.info("All critical resources closed")
  }catch(err){
    logger.error("Error during app shutdown", err)
  } finally {
    process.exit(0)
  }
  
}

// Handlers globals → out of main()
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

process.on("uncaughtException", (err) => {
  Logger.get().error("Uncaught Exception", err);
  void shutdown()
});

process.on("unhandledRejection", (reason) => {
  Logger.get().error("Unhandled Rejection", reason);
  void shutdown()
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
      // console.log("Starting GivenNames API server...");
      await server.run()
      // const { serve } = await import("@hono/node-server")
      // const serverModule = await import("@/server")

      // const port = config.server.port || 3000

      // const tempRT = (true as false) || serve({fetch:null, port :0} )
      // type serveReturnType = typeof tempRT

      // let httpServer:serveReturnType  //= serve({ fetch: serverModule.default.fetch, port })

      // if (config.server.useTLS) {
      //   if (!config.server.tlsKey || !config.server.tlsCert) {
      //     throw new Error("TLS enabled but missing tlsKey/tlsCert in config");
      //   }        
      //   httpServer = serve({
      //     fetch: serverModule.default.fetch,
      //     port,
      //     tls: {
      //       key: readFileSync(config.server.tlsKey!),
      //       cert: readFileSync(config.server.tlsCert!)
      //     },
      //   } as any)
      //   logger.info(`HTTPS server listening on https://localhost:${port}`)
      // } else {
      //   httpServer = serve({ fetch: serverModule.default.fetch, port })
      //   logger.info(`HTTP server listening on http://localhost:${port}`)
      // }

      // terminator = createHttpTerminator({ server: httpServer as any})
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


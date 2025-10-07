// vitest-setup.ts
// import { beforeAll, afterAll } from "vitest"
// import { ConfigManager } from "@/config.js" 

// // Inicialitza ConfigManager perquè carrega l'.env i prepara el rootPath
// console.log(`\nRunning Config:\n`)
// console.dir ( ConfigManager.config(process.cwd()))

// Assegura variables d’entorn requerides pels tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret"
}
if (!process.env.COOKIE_SECRET) {
  process.env.COOKIE_SECRET = "cookie-secret"
}
console.log ( "[vitest-setup] Global test environment prepared.Setup done")


afterAll(async () => {
  /**
   * Global teardown for Jest
   * ------------------------
   * This runs *once* after all test suites have finished.
   * Use it to clean up resources initialized in global-setup,
   * e.g. temporary databases, mock servers, or connections.
   */
  console.log ( "Teardwon done")
  // TODO: Add real teardown logic if needed.
})

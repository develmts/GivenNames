import { ConfigManager } from "../../config";
import os from "os"
import path from "path";
const cfg = ConfigManager.config(process.cwd())
;(cfg as any).db.file = path.join(os.tmpdir(), "users-test.sqlite")


// beforeAll -> amb promise
beforeAll(() => {
  // 1. Config inicial amb db.file temporal
  process.env.DB_FILE = ":memory:"
  const cfg = ConfigManager.config(process.cwd())
  ;(cfg as any).db.file = path.join(os.tmpdir(), "users-test.sqlite")
  // console.log(`Test DB path: ${cfg.db.file}`)

  // 2. Carreguem UserService dinàmicament
  return import("../../services/UserService").then(mod => {
    UserService = mod.UserService

    // 3. Prepara DB temporal i reconnecta ORM
    testDb = setupTestDb("data/sql/schema_users.sql", true)
    //UsersORM.reconnect(testDb.db)
    UsersORM.reconnect(testDb.dbPath)
  })
})
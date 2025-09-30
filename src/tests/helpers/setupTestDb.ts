// setupTestDb.ts
import fs from "fs";
import path from "path";
import os from "os";
import Database from "better-sqlite3";

export interface TestDb {
  dbPath: string;
  db: Database.Database;
  cleanup: () => void;
}

/**
 * Setup a temporary SQLite database for testing.
 * Loads the schema from the given .sql file.
 *
 * @param schemaFile absolute or relative path to SQL schema
 * @param useMemory if true, use ":memory:" instead of file on disk
 */
export function setupTestDb(schemaFile: string, useMemory = false): TestDb {
  if (!schemaFile) {
    throw new Error("setupTestDb requires a schema file path");
  }

  // 1. Decide DB path
  let dbPath: string;
  let tmpDir: string | null = null;

  if (useMemory) {
    dbPath = ":memory:";
  } else {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "testdb-"));
    dbPath = path.join(tmpDir, "test.sqlite");
  }

  // 2. Open connection
  const db = new Database(dbPath);

  // 3. Load schema
  const absSchema = path.resolve(process.cwd(), schemaFile);
  if (!fs.existsSync(absSchema)) {
    throw new Error(`Schema file not found: ${absSchema}`);
  }
  const schemaSql = fs.readFileSync(absSchema, "utf-8");
  db.exec(schemaSql);

  // 4. Return object with cleanup
  return {
    dbPath,
    db,
    cleanup: () => {
      db.close();
      if (tmpDir) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    },
  };
}

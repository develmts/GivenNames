import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { strict as assert } from "assert";

describe.skip("Clusters seed initialization", () => {
  const projectRoot = path.resolve(__dirname, "../../../../"); // ajusta fins arrel
  const dbPath = path.join(projectRoot, "data/db/testdb.sqlite");
  
  let db: Database

  beforeAll(() => {
    // clean old test DB if exists
    //const projectRoot = path.resolve(__dirname, "../../../../../.."); // ajusta fins arrel
    const schemaPath = path.join(projectRoot, "data/sql/schema_givennames-normalized_v4.sql");
    const seedPath = path.join(projectRoot, "data/sql/clusters_seed.sql");
    
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      // fs.mkdirSync(dir, { recursive: true });
      throw new Error(`Directory for test DB does not exist: ${dir}`);
    }
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
    }

    db = new Database(dbPath);

    // load schema
    //const schemaPath = path.resolve(__dirname, "../data/sql/schema_givennames-normalized_v4.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schema);

    // load clusters seed
    // const seedPath = path.resolve(__dirname, "../data/sql/clusters_seed.sql");
    const seed = fs.readFileSync(seedPath, "utf-8");
    db.exec(seed);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
    }
  });

  test("should have 13 clusters seeded", () => {
    const row = db.prepare("SELECT COUNT(*) as cnt FROM Clusters").get();
    assert.equal(row.cnt, 13);
  });

  test("should include specific cluster labels", () => {
    const labels = db.prepare("SELECT label FROM Clusters ORDER BY cluster_id").all().map((r: any) => r.label);

    expect(labels).toContain("Virtues");
    expect(labels).toContain("Flowers and plants");
    expect(labels).toContain("Gemstones");
    expect(labels).toContain("Literary and cinematic");
  });
});

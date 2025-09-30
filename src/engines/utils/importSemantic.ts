// importClusterSeeds.ts
//
// Minimal tool to import cluster seeds JSON files into SQLite
// Usage: ts-node importClusterSeeds.ts <path_to_sqlite_db> <folder_with_jsons>

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

function importClusterSeeds(dbPath: string, jsonDir: string) {

  let outLines : string[] = [];
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found: ${dbPath}`);
  }
  if (!fs.existsSync(jsonDir)) {
    throw new Error(`JSON folder not found: ${jsonDir}`);
  }

  let insertCluster: any, getClusterId: any, insertMember: any;
  
  const db = new Database(dbPath, { fileMustExist: true });

  // show DB and Tables
  // console.log("[Importer] PRAGMA database_list =", db.prepare("PRAGMA database_list").all());
  // console.log("[Importer] tables =", db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());

  // Verifica que 'clusters' existeix
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='Clusters'").get()) {
    throw new Error(`[Importer] Schema not initialized at ${dbPath} (missing table 'clusters')`);
  }else{
    outLines.push("[Importer] Schema verified (table 'Clusters' exists).");
  }
  insertCluster =  {
    sql: `INSERT OR IGNORE INTO Clusters (label, description) VALUES (?, ?)`,
    obj: undefined
  }

  getClusterId =  {
    sql: `SELECT cluster_id FROM Clusters WHERE label = ?`,
    obj: undefined
  }

  insertMember =  {
    sql: `INSERT OR IGNORE INTO ClusterMembers (cluster_id, name_id) VALUES (?, ?)`,
    obj: undefined
  }

  try{
    // outLines.push("Preparing query insertCluster:",`
    //   INSERT OR IGNORE INTO Clusters (label, description) VALUES (?, ?)
    // ` );
    outLines.push("Preparing query insertCluster:", insertCluster.sql.split(/\r+\n/).filter(Boolean));
    insertCluster.obj = db.prepare(insertCluster.sql);
  } catch (e){
    // throw ("Error preparing insertCluster", e);
    throw e;
  }

  try{
    outLines.push( "Preparing getClusterId: "+ getClusterId.sql.split(/\r+\n/).filter(Boolean));
    getClusterId.obj = db.prepare(getClusterId.sql);
  } catch (e){
    // console.error("Error preparing getClusterId", e);
    throw e;
  }

  try{
    outLines.push( "Preparing insertMember:", insertMember.sql.split(/\r+\n/).filter(Boolean));
    insertMember.obj = db.prepare(insertMember.sql);
  } catch (e){
    // console.error("Error preparing insertMember", e);
    throw e;
  } 
  
  // console.log ( "Getting file List")
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith(".json"));
  outLines.push (`Files to process: ${files.length}`)

  for (const file of files) {
    const fpath = path.join(jsonDir, file);
    const raw = fs.readFileSync(fpath, "utf-8");
    const data = JSON.parse(raw) as { cluster: string; examples: string[] };
   
    insertCluster.obj.run(data.cluster, `${data.cluster} semantic cluster`);
    const row = getClusterId.obj.get(data.cluster);
    if (!row) {
      outLines.push(`!! Could not resolve cluster_id for ${data.cluster}`);
      continue;
    }
    
    for (const name of data.examples) {
      insertMember.obj.run(row.id, name);
    }
    outLines.push(`→ Importing cluster '${data.cluster}' from ${file}. ${data.examples.length} seeds Done}`);
  }

  outLines.push("✓ Import finished.");
  console.log (outLines.join("\n"));
  db.close();
}

export function semImport(rootPath:string = "./"){
  const dbRelPath="data/db/givennames_v4.sqlite";
  const jsonRelDir="data/semantic"
  importClusterSeeds(
    path.resolve(rootPath, dbRelPath), 
    path.resolve(rootPath, jsonRelDir)
  );

}

// CLI
if (require.main === module) {
  // const dbPath = process.argv[2];
  // const jsonDir = process.argv[3];
  // if (!dbPath || !jsonDir) {
  //   console.error("Usage: ts-node importClusterSeeds.ts <db.sqlite> <json_folder>");
  //   process.exit(1);
  // }
  const dbPath="data/db/givennames_v4.sqlite";
  const jsonDir="data/semantic"
  importClusterSeeds(dbPath, jsonDir);
}

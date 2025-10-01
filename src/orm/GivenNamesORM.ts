// Version 5.0
// db/GivenNamesORM.ts
// ORM for Given Names database (SQLite)

import Database from "better-sqlite3";
import Logger from "@/utils/logger";

const logger = Logger.get();

// export class GivenNamesORM {
// private db: Database.Database;
//
// constructor(dbPath: string) {
//   try {
//     this.db = new Database(dbPath);
//     logger.info(`[ORM] Connected to database at ${dbPath}`);
//   } catch (err) {
//     logger.error(`[ORM] Failed to connect to database at ${dbPath}`, err);
//     throw err;
//   }
// }
// db/GivenNamesORM.ts

export class GivenNamesORM {
  private static instance: GivenNamesORM;
  private db: Database.Database;

  private constructor(dbPath: string) {
    try {
      this.db = new Database(dbPath);
      logger.info(`[ORM] Connected to database at ${dbPath}`);
    } catch (err) {
      logger.error(`[ORM] Failed to connect to database at ${dbPath}`, err);
      throw err;
    }
  }

  public static connect(dbPath?: string): GivenNamesORM {
    if (!GivenNamesORM.instance) {
      if (!dbPath) {
        throw new Error("[ORM] First call to getInstance() requires a dbPath");
      }
      GivenNamesORM.instance = new GivenNamesORM(dbPath);
    }
    return GivenNamesORM.instance;
  }

  /**
   * Insert a new name into the database.
   */
  insertName(name: string, locale: string, gender: string): number {
    const cleanName = name.trim();
    const cleanLocale = locale.trim().toLowerCase();
    const cleanGender = gender.trim().toLowerCase();

    if (!cleanName || !cleanLocale || !cleanGender) {
      throw new Error("insertName: No empty fields allowed");
    }

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO names (name, locale, gender)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(cleanName, cleanLocale, cleanGender);

    if (result.lastInsertRowid) {
      return Number(result.lastInsertRowid);
    }

    const sel = this.db.prepare(
      `SELECT id FROM names WHERE name = ? AND locale = ? AND gender = ?`
    );
    const row = sel.get(cleanName, cleanLocale, cleanGender);
    return row?.id ?? 0;
  }

  async insertNameAtomic(data: {
    name: string;
    locale: string;
    gender: string;
    sourceUrl?: string;
    variants?: { name: string; locale: string; gender: string }[];
    translations?: { name: string; locale: string; gender: string }[];
    clusters?: number[];
  }): Promise<number> {
    const db = this.db;
    try {
      await db.exec("BEGIN");

      // 1. Insert name
      const nameId = await this.insertName(data.name, data.locale, data.gender);

      // 2. Insert source (optional)
      if (data.sourceUrl) {
        await this.addNameSource(nameId, data.sourceUrl);
      }

      // 3. Insert variants (optional)
      if (data.variants?.length) {
        for (const variant of data.variants) {
          const variantId = await this.insertName(
            variant.name,
            variant.locale,
            variant.gender
          );
          await this.addVariant(nameId, variantId);
        }
      }

      // 4. Insert translations (optional)
      if (data.translations?.length) {
        for (const translation of data.translations) {
          const transId = await this.insertName(
            translation.name,
            translation.locale,
            translation.gender
          );
          await this.addTranslation(nameId, transId, translation.locale);
        }
      }

      // 5. Insert clusters (optional)
      if (data.clusters?.length) {
        for (const clusterId of data.clusters) {
          await this.addClusterMember(nameId, clusterId);
        }
      }

      await db.exec("COMMIT");
      return nameId;
    } catch (error) {
      await db.exec("ROLLBACK");
      throw new Error(
        `Failed atomic insertion for name=${data.name}: ${error}`
      );
    }
  }

  /**
   * Get a name by id.
   */
  getNameById(nameId: number): any {
    const stmt = this.db.prepare(
      `SELECT id, name, locale, gender FROM names WHERE id = ?`
    );
    return stmt.get(nameId);
  }

  /**
   * Check if a name exists by id.
   */
  nameExists(nameId: number): boolean {
    const stmt = this.db.prepare(`SELECT 1 FROM names WHERE id = ?`);
    const row = stmt.get(nameId);
    return !!row;
  }

  /**
   * Update a name by id.
   */
  updateName(
    nameId: number,
    fields: { name?: string; locale?: string; gender?: string }
  ): void {
    const updates: string[] = [];
    const values: any[] = [];
    if (fields.name) {
      updates.push("name = ?");
      values.push(fields.name);
    }
    if (fields.locale) {
      updates.push("locale = ?");
      values.push(fields.locale);
    }
    if (fields.gender) {
      updates.push("gender = ?");
      values.push(fields.gender);
    }
    if (updates.length === 0) return;
    const sql = `UPDATE names SET ${updates.join(", ")} WHERE id = ?`;
    values.push(nameId);
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }

  /**
   * Insert a source for a name.
   */
  addNameSource(nameId: number, source: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO NameSources (name_id, source)
      VALUES (?, ?)
    `);
    stmt.run(nameId, source);
  }

  /**
   * Delete a name by id.
   */
  deleteName(nameId: number): void {
    const stmt = this.db.prepare(`DELETE FROM names WHERE id = ?`);
    stmt.run(nameId);
  }

  /**
   * Retrieve a name with all its relationships (variants, translations, clusters).
   */
  getFullNameRelatedData(nameId: number) {
    const nameStmt = this.db.prepare(`
      SELECT id, name, locale, gender
      FROM Names
      WHERE id = ?
    `);

    const variantsStmt = this.db.prepare(`
      SELECT n.id, n.name, n.locale, n.gender
      FROM Variants v
      JOIN Names n ON n.id = v.variant_id
      WHERE v.name_id = ?
    `);

    const translationsStmt = this.db.prepare(`
      SELECT n.id, n.name, n.locale, n.gender, t.locale AS translation_locale
      FROM Translations t
      JOIN Names n ON n.id = t.translated_name_id
      WHERE t.name_id = ?
    `);

    const clustersStmt = this.db.prepare(`
      SELECT c.cluster_id, cl.label
      FROM ClusterMembers c
      JOIN Clusters cl ON cl.id = c.cluster_id
      WHERE c.name_id = ?
    `);

    const name = nameStmt.get(nameId);
    if (!name) {
      return null;
    }

    const variants = variantsStmt.all(nameId);
    const translations = translationsStmt.all(nameId);
    const clusters = clustersStmt.all(nameId);

    return {
      ...name,
      variants,
      translations,
      clusters,
    };
  }

  // ---------------------------------------------------------------------------
  // VARIANTS
  // ---------------------------------------------------------------------------

  /**
   * Insert a bidirectional variant relationship.
   */
  addVariant(nameId: number, variantId: number): void {
    if (!this.nameExists(nameId) || !this.nameExists(variantId)) {
      throw new Error(
        `One or both name IDs (${nameId}, ${variantId}) do not exist.`
      );
    }
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO variants (name_id, variant_id)
      VALUES (?, ?)
    `);
    const trx = this.db.transaction((a: number, b: number) => {
      stmt.run(a, b);
      stmt.run(b, a);
    });
    trx(nameId, variantId);
  }

  /**
   * Remove a bidirectional variant relationship.
   */
  removeVariant(nameId: number, variantId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM variants
      WHERE (name_id = ? AND variant_id = ?)
         OR (name_id = ? AND variant_id = ?)
    `);
    stmt.run(nameId, variantId, variantId, nameId);
  }

  /**
   * Get all direct variants of a name.
   */
  getVariants(nameId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT v.variant_id AS id, n.name, n.locale, n.gender
      FROM variants v
      JOIN names n ON n.id = v.variant_id
      WHERE v.name_id = ?
    `);
    return stmt.all(nameId);
  }

  /**
   * Get all variant IDs for a given name.
   */
  getVariantIds(nameId: number): number[] {
    const stmt = this.db.prepare(
      `SELECT variant_id FROM variants WHERE name_id = ?`
    );
    return stmt.all(nameId).map((row: any) => row.variant_id);
  }

  /**
   * Get variants for (name, locale, gender) in both directions.
   * Returns rows: { id, name, locale, gender } for each variant partner.
   */
  getVariantsByName(name: string, locale: string, gender: string): any[] {
    const stmt = this.db.prepare(`
    SELECT DISTINCT n2.id, n2.name, n2.locale, n2.gender
    FROM names n
    JOIN variants v ON v.name_id = n.id
    JOIN names n2 ON n2.id = v.variant_id
    WHERE n.name = ? AND n.locale = ? AND n.gender = ?
    UNION
    SELECT DISTINCT n1.id, n1.name, n1.locale, n1.gender
    FROM names n
    JOIN variants v ON v.variant_id = n.id
    JOIN names n1 ON n1.id = v.name_id
    WHERE n.name = ? AND n.locale = ? AND n.gender = ?
  `);
    return stmt.all(name, locale, gender, name, locale, gender);
  }

  /**
   * List all variant relations (admin/debug).
   * Returns rows: { name_id, name, variant_id, variant_name }.
   */
  listAllVariants(limit = 100, removeDuplicates: boolean = false): any[] {
    let sql = `
    SELECT v.name_id,
           n1.name AS name,
           v.variant_id,
           n2.name AS variant_name
    FROM variants v
    JOIN names n1 ON n1.id = v.name_id
    JOIN names n2 ON n2.id = v.variant_id
  `;

    if (removeDuplicates) {
      sql += `WHERE v.name_id < v.variant_id`;
    }

    sql += ` LIMIT ?`;
    const stmt = this.db.prepare(sql);
    return stmt.all(limit);
  }

  // ---------------------------------------------------------------------------
  // TRANSLATIONS
  // ---------------------------------------------------------------------------

  /**
   * Add a translation between two names.
   */
  addTranslation(
    nameId: number,
    translatedNameId: number,
    locale: string
  ): void {
    if (!this.nameExists(nameId) || !this.nameExists(translatedNameId)) {
      throw new Error(
        `One or both name IDs (${nameId}, ${translatedNameId}) do not exist.`
      );
    }
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO translations (name_id, translated_name_id, locale)
      VALUES (?, ?, ?)
    `);
    stmt.run(nameId, translatedNameId, locale);
  }

  /**
   * Remove a translation.
   */
  removeTranslation(nameId: number, translatedNameId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM translations
      WHERE name_id = ? AND translated_name_id = ?
    `);
    stmt.run(nameId, translatedNameId);
  }

  /**
   * Get all translations of a name.
   */
  getTranslations(nameId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT t.translated_name_id AS id, n.name, n.locale, n.gender
      FROM translations t
      JOIN names n ON n.id = t.translated_name_id
      WHERE t.name_id = ?
    `);
    return stmt.all(nameId);
  }

  /**
   * Get all translation IDs for a given name.
   */
  getTranslationIds(nameId: number): number[] {
    const stmt = this.db.prepare(
      `SELECT translated_name_id FROM translations WHERE name_id = ?`
    );
    return stmt.all(nameId).map((row: any) => row.translated_name_id);
  }

  /**
   * Get translations for (name, locale, gender) in both directions.
   * Returns rows with: id, name, locale, gender (id = translated partner's id).
   */
  getTranslationsByName(name: string, locale: string, gender: string): any[] {
    const stmt = this.db.prepare(`
      SELECT t.translated_name_id AS id, n2.name, n2.locale, n2.gender
      FROM names n
      JOIN translations t ON t.name_id = n.id
      JOIN names n2 ON n2.id = t.translated_name_id
      WHERE n.name = ? AND n.locale = ? AND n.gender = ?
      UNION
      SELECT t.name_id AS id, n1.name, n1.locale, n1.gender
      FROM names n
      JOIN translations t ON t.translated_name_id = n.id
      JOIN names n1 ON n1.id = t.name_id
      WHERE n.name = ? AND n.locale = ? AND n.gender = ?
    `);
    return stmt.all(name, locale, gender, name, locale, gender);
  }

  /**
   * List all translations (for admin/debug).
   */
  listAllTranslations(limit = 100): any[] {
    const stmt = this.db.prepare(`
      SELECT t.name_id, t.translated_name_id, t.locale
      FROM translations t
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // ---------------------------------------------------------------------------
  // CLUSTERS
  // ---------------------------------------------------------------------------

  /**
   * Get all clusters directly linked to a name.
   */
  getClusters(nameId: number): any[] {
    const stmt = this.db.prepare(`
      SELECT cm.cluster_id, c.label
      FROM cluster_members cm
      JOIN clusters c ON c.cluster_id = cm.cluster_id
      WHERE cm.name_id = ?
    `);
    return stmt.all(nameId);
  }

  /**
   * Get all clusters linked to a specific (name, locale, gender).
   */
  getClustersByName(name: string, locale: string, gender: string): any[] {
    const stmt = this.db.prepare(`
      SELECT cm.cluster_id, c.label
      FROM names n
      JOIN cluster_members cm ON cm.name_id = n.id
      JOIN clusters c ON c.cluster_id = cm.cluster_id
      WHERE n.name = ? AND n.locale = ? AND n.gender = ?
    `);
    return stmt.all(name, locale, gender);
  }

  /**
   * Check if a cluster exists.
   */
  clusterExists(clusterId: number): boolean {
    const stmt = this.db.prepare(`SELECT 1 FROM clusters WHERE id = ?`);
    const row = stmt.get(clusterId);
    return !!row;
  }

  /**
   * Insert a name-cluster relation if not exists.
   */
  addClusterMember(nameId: number, clusterId: number): void {
    if (!this.clusterExists(clusterId)) {
      throw new Error(`Cluster with id ${clusterId} does not exist.`);
    }
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO cluster_members (name_id, cluster_id)
      VALUES (?, ?)
    `);
    stmt.run(nameId, clusterId);
  }

  /**
   * Remove a name-cluster relation.
   */
  removeClusterMember(nameId: number, clusterId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM cluster_members
      WHERE name_id = ? AND cluster_id = ?
    `);
    stmt.run(nameId, clusterId);
  }

  /**
   * Get all cluster IDs for a given name.
   */
  getClusterIds(nameId: number): number[] {
    const stmt = this.db.prepare(
      `SELECT cluster_id FROM cluster_members WHERE name_id = ?`
    );
    return stmt.all(nameId).map((row: any) => row.cluster_id);
  }

  // ---------------------------------------------------------------------------
  // UTILS
  // ---------------------------------------------------------------------------

  /**
   * Test the database connection.
   */
  testConnection(): boolean {
    try {
      this.db.prepare("SELECT 1").get();
      return true;
    } catch (err) {
      logger.error("[ORM] Database connection test failed", err);
      return false;
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
    logger.info("[ORM] Database connection closed");
  }
}

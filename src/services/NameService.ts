// Version 4 
// NameService.ts
import { GivenNamesORM } from "@/orm/GivenNamesORM.js";
import { VariantService } from "@/services/VariantService.js";
import { TranslationService } from "@/services/TranslationService.js";
import { ClusterService } from "@/services/ClusterService.js";
import Logger from "@/utils/logger.js";

const logger = Logger.get();

export class NameService {
  private variants: VariantService;
  private translations: TranslationService;
  private clusters: ClusterService;
  private orm: GivenNamesORM
  constructor() {
    this.orm = GivenNamesORM.connect()
    this.variants = new VariantService();
    this.translations = new TranslationService();
    this.clusters = new ClusterService();
  }

  /**
   * Insert a name and attach variants, translations, clusters, sources if provided.
   */
  async insertName(
    name: string,
    locale: string,
    gender: string,
    options?: {
      source?: string;
      variantIds?: number[];
      translationIds?: { id: number; locale: string }[];
      clusterIds?: number[];
    }
  ): Promise<number> {
    const nameId = this.orm.insertName(name, locale, gender);
    if (options?.source) {
      this.orm.addNameSource(nameId, options.source);
    }
    if (options?.variantIds) {
      for (const v of options.variantIds) {
        this.variants.addVariant(nameId, v);
      }
    }
    if (options?.translationIds) {
      for (const t of options.translationIds) {
        this.translations.addTranslation({
          nameId,
          translatedNameId: t.id,
          locale: t.locale,
        });
      }
    }
    if (options?.clusterIds) {
      for (const c of options.clusterIds) {
        this.clusters.addCluster(nameId, c);
      }
    }

    logger.info(`[NameService] Inserted name=${name} id=${nameId}`);
    return nameId;
  }
  /**
   * Atomically Insert a name and attach variants, translations, clusters, sources if provided.
   */
  async insertFullName(data: {
    name: string;
    locale: string;
    gender: string;
    sourceUrl?: string;
    variants?: { name: string; locale: string; gender: string }[];
    translations?: { name: string; locale: string; gender: string }[];
    clusters?: number[];
  }): Promise<number> {
    return await this.orm.insertNameAtomic(data);
  }
  /**
   * Delete a name and all its relations (variants, translations, clusters).
   */
  async deleteName(nameId: number): Promise<void> {
    try {
      // remove variants

      // const vars = await this.variants.getVariants(nameId);
      // for (const v of vars) {
      //   this.variants.removeVariant(nameId, v.id);
      // }
      const variants = await this.variants.getVariants(nameId);
      for (const vId of variants) {
        this.variants.removeVariant(nameId, vId);
      }

      // remove translations
      const trans = this.translations.getTranslations(nameId);
      for (const t of trans) {
        this.translations.removeTranslation(nameId, t.id);
      }

      // remove clusters

      // const clusts = await this.clusters.getClusters(nameId);
      // for (const c of clusts) {
      //   this.clusters.removeCluster(nameId, c.cluster_id);
      // }

      // remove clusters
      const clusters = await this.clusters.getClusters(nameId);
      for (const clusterId of clusters) {
        // if (typeof c === "number") {
        //   this.clusters.removeCluster(nameId, c);
        // } else if ("cluster_id" in c) {
        //   this.clusters.removeCluster(nameId, c.cluster_id);
        // }
        this.clusters.removeCluster(nameId, clusterId);
      }

      // finally, delete name itself
      const stmt = this.orm["db"].prepare(`DELETE FROM names WHERE id = ?`);
      stmt.run(nameId);

      logger.info(`[NameService] Deleted nameId=${nameId}`);
    } catch (err) {
      logger.error(`[NameService] Failed to delete nameId=${nameId}`, err);
      throw err;
    }
  }

  /**
   * Update fields for a name. If locale/gender change, recompute clusters.
   */
  async updateName(
    nameId: number,
    fields: { name?: string; locale?: string; gender?: string }
  ): Promise<void> {
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

    const stmt = this.orm["db"].prepare(sql);
    stmt.run(...values);

    // Recompute clusters if locale/gender changed
    if (fields.locale || fields.gender) {
      await this.clusters.recomputeClustersForName(nameId);
    }

    logger.info(`[NameService] Updated nameId=${nameId} with fields=${JSON.stringify(fields)}`);
  }

  /**
   * Get full related data for a name (variants, translations, clusters).
   */
  async getFullNameRelatedData(nameId: number): Promise<any> {
    // const stmt = this.orm["db"].prepare(
    //   `SELECT id, name, locale, gender FROM names WHERE id = ?`
    // );
    // const base = stmt.get(nameId);
    // if (!base) {
    //   return null;
    // }

    // const variants = await this.variants.getVariants(nameId);
    // const translations = this.translations.getTranslations(nameId);
    // const clusters = await this.clusters.getClusters(nameId);

    // return {
    //   ...base,
    //   variants,
    //   translations,
    //   clusters,
    // };
    return this.orm.getFullNameRelatedData(nameId);
   }

  /**
   * Insert multiple names efficiently in batch.
   */

  async insertBatch(
    names: string[],
    meta: {
      locale: string;
      gender: string;
      source: string;
      timestamp: string;
    },
    opts: { dryRun?: boolean } = {}
  ): Promise<number[]> {
    const inserted: number[] = [];
    const trx = this.orm["db"].transaction(() => {
      for (const name of names) {
        const id = this.orm.insertName(name, meta.locale, meta.gender);
        if (meta.source) {
          this.orm.addNameSource(id, meta.source);
        }
        inserted.push(id);
      }
    });
    if (!opts.dryRun) trx();
    return inserted;
  }

  // async decorate(input: {
  //   name: string;
  //   locale: string;
  //   gender: string;
  //   variants?: string[];
  //   translations?: { name: string; locale: string }[];
  //   clusters?: string[];
  // }) {
  //   const variantCandidates = this.variants.findVariants(
  //     input.name,
  //     input.locale,
  //     input.gender,
  //     input.variants
  //   );

  //   const translationCandidates = this.translations.findTranslations(
  //     input.name,
  //     input.locale,
  //     input.gender,
  //     input.translations
  //   );

  //   const clusterCandidates = this.clusters.findClusters(
  //     input.name,
  //     input.locale,
  //     input.gender,
  //     input.clusters,
  //     variantCandidates,
  //     translationCandidates
  //   );

  //   return {
  //     name: input.name,
  //     locale: input.locale,
  //     gender: input.gender,
  //     variants: variantCandidates,
  //     translations: translationCandidates,
  //     clusters: clusterCandidates,
  //   };
  // }



}

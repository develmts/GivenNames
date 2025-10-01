//Version 4
// ClusterService.ts
import { GivenNamesORM } from "@/orm/GivenNamesORM";
import Logger from "@/utils/logger";
import { VariantCandidate } from "@/services/VariantService";
import { TranslationCandidate } from "@/services/TranslationService";

const logger = Logger.get();

export interface ClusterCandidate {
  label: string;
  confidence: number;
}

export class ClusterService {
  private orm: GivenNamesORM
  constructor() {
    this.orm = GivenNamesORM.connect()
  }

  
  /**
   * Afegeix relació Nom-Cluster.
   */
  async addCluster(nameId: number, clusterId: number): Promise<void> {
    // this.orm.db
    //   .prepare(`INSERT OR IGNORE INTO cluster_members (name_id, cluster_id) VALUES (?, ?)`)
    //   .run(nameId, clusterId);
    this.orm.addClusterMember(nameId, clusterId);
    logger.info(`[ClusterService] Added cluster=${clusterId} to nameId=${nameId}`);
  }

  /**
   * Elimina relació Nom-Cluster.
   */
  async removeCluster(nameId: number, clusterId: number): Promise<void> {

    // this.orm.db
    //   .prepare(`DELETE FROM cluster_members WHERE name_id = ? AND cluster_id = ?`)
    //   .run(nameId, clusterId);
    this.orm.removeClusterMember(nameId, clusterId);
    logger.info(`[ClusterService] Removed cluster=${clusterId} from nameId=${nameId}`);
  }

  /**
   * Retorna tots els clusters assignats a un nom.
   */
  async getClusters(nameId: number): Promise<number[]> {
    // const rows = this.orm.db
    //   .prepare(`SELECT cluster_id FROM cluster_members WHERE name_id = ?`)
    //   .all(nameId);

    // return rows.map((r: any) => r.cluster_id);
    return this.orm.getClusterIds(nameId)
  }

  /**
   * Recalcula els clusters d’un nom a partir de les seves variants i traduccions.
   * (pot ser invocat periòdicament o després d’inserir nous links)
   */
  async recomputeClustersForName(nameId: number) {
    try {
      // variants
      const variantIds = this.orm.getVariantIds(nameId);
      const clustersFromVariants = variantIds.flatMap(vId =>
        this.orm.getClusterIds(vId)
      );

      // translations
      const translationIds = this.orm.getTranslationIds(nameId);
      const clustersFromTranslations = translationIds.flatMap(tId =>
        this.orm.getClusterIds(tId)
      );

      // unificar
      const allClusters = new Set<number>([
        ...clustersFromVariants,
        ...clustersFromTranslations,
      ]);

      for (const clusterId of allClusters) {
        this.orm.addClusterMember(nameId, clusterId);
      }
      logger.info(`[ClusterService] Recomputed clusters for nameId=${nameId}, total=${allClusters.size}`);
    } catch (err) {
      logger.error(`[ClusterService] Failed to recompute clusters for nameId=${nameId}`, err);
      throw err;
    }      
  }

  /**
   * 🔎 Funció per NameEnrichmentService.
   * Retorna candidats a clusters basats en:
   * - Assignacions directes
   * - Variants confirmades
   * - Traduccions confirmades
   * - Manuals suggerides
   */
  findClusters(
    name: string,
    locale: string,
    gender: string,
    manualClusters?: string[],
    variantCandidates?: VariantCandidate[],
    translationCandidates?: TranslationCandidate[]
  ): ClusterCandidate[] {
    const candidates: ClusterCandidate[] = [];

    // 1️⃣ Clusters manuals
    if (manualClusters && manualClusters.length > 0) {
      for (const mc of manualClusters) {
        candidates.push({ label: mc, confidence: 0.5 });
        logger.debug(`[ClusterService] Added manual cluster candidate: ${mc}`);
      }
    }

    // 2️⃣ Clusters directes del nom (ORM)
    try {
      const dbClusters = this.orm.getClustersByName(name, locale, gender);
      for (const c of dbClusters) {
        candidates.push({ label: c.label, confidence: 0.9 });
      }
      logger.debug(`[ClusterService] Found ${dbClusters.length} DB clusters for ${name}`);
    } catch (err) {
      logger.error(`[ClusterService] Error fetching DB clusters for ${name}`, err);
    }

    // 3️⃣ Clusters de variants confirmades
    if (variantCandidates) {
      for (const v of variantCandidates.filter(vc => vc.confidence >= 0.9)) {
        try {
          const vClusters = this.orm.getClustersByName(v.name, locale, gender);
          for (const c of vClusters) {
            candidates.push({ label: c.label, confidence: 0.7 });
          }
        } catch (err) {
          logger.error(`[ClusterService] Error fetching clusters for variant=${v.name}`, err);
        }
      }
    }

    // 4️⃣ Clusters de traduccions confirmades
    if (translationCandidates) {
      for (const t of translationCandidates.filter(tc => tc.confidence >= 0.9)) {
        try {
          const tClusters = this.orm.getClustersByName(t.name, t.locale, gender);
          for (const c of tClusters) {
            candidates.push({ label: c.label, confidence: 0.7 });
          }
        } catch (err) {
          logger.error(`[ClusterService] Error fetching clusters for translation=${t.name}`, err);
        }
      }
    }

    return candidates;
  }

}


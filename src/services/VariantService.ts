// Version 4 
// VariantService.ts
import { GivenNamesORM } from "@/orm/GivenNamesORM.js";
import Logger from "@/utils/logger.js";

const logger = Logger.get();

export interface VariantCandidate {
  name: string;
  confidence: number;
}

export class VariantService {
  private orm: GivenNamesORM
  constructor() {
    this.orm = GivenNamesORM.connect()
  }

  /**
   * Afegeix una relació de variant bidireccional (A <-> B).
   */
  async addVariant(nameId: number, variantId: number): Promise<void> {
    if (nameId === variantId) return; // no té sentit A=A

    this.orm.addVariant(nameId, variantId);
    logger.debug(
      `[VariantService] Added variant relation between IDs ${nameId} <-> ${variantId}`
    );
  }

  /**
   * Elimina la relació bidireccional (A<->B).
   */
  async removeVariant(nameId: number, variantId: number): Promise<void> {
;
    this.orm.removeVariant(nameId, variantId);
    logger.debug(
      `[VariantService] Removed variant relation between IDs ${nameId} <-> ${variantId}`
    );
  }

  /**
   * Retorna tots els IDs de variants directes d’un nom.
   */
  async getVariants(nameId: number): Promise<number[]> {
    // return rows.map((r: any) => r.variant_id);
    return this.orm.getVariantIds(nameId);
  }

  /**
   * Retorna tota la component connexa de variants (variants de variants, etc.).
   * Implementació amb BFS.
   */
  async getVariantGroup(nameId: number): Promise<number[]> {
    const visited = new Set<number>();
    const stack = [nameId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!visited.has(current)) {
        visited.add(current);
        const neighbors = this.orm.getVariantIds(current);
        neighbors.forEach(n => {
          if (!visited.has(n)) stack.push(n);
        });
      }
    }

    return Array.from(visited);
  }

  /**
   * 🔎 Funció principal per NameEnrichmentService.
   * Busca variants per un nom donat (manuals + DB).
   */
  findVariants(
    name: string,
    locale: string,
    gender: string,
    manualVariants?: string[]
  ): VariantCandidate[] {
    const candidates: VariantCandidate[] = [];

    // 1️⃣ Variants manuals
    if (manualVariants && manualVariants.length > 0) {
      for (const mv of manualVariants) {
        candidates.push({ name: mv, confidence: 0.5 });
        logger.debug(`[VariantService] Added manual variant candidate: ${mv}`);
      }
    }

    // 2️⃣ Variants confirmades a DB (via ORM)
    try {
      const dbVariants = this.orm.getVariantsByName(name, locale, gender);
      for (const v of dbVariants) {
        candidates.push({ name: v.name, confidence: 0.9 });
      }
      logger.debug(`[VariantService] Found ${dbVariants.length} DB variants for ${name}`);
    } catch (err) {
      logger.error(`[VariantService] Error fetching DB variants for ${name}`, err);
    }

    // 🔮 3️⃣ [futur] Heurístiques (fuzzy, normalització)
    // Aquí es poden afegir més candidats amb confidence 0.6

    return candidates;
  }

  /**
   * Llista totes les variants existents a DB (útil per admin/debug).
   */
  listAll(limit = 100): VariantCandidate[] {
    try {
      const all = this.orm.listAllVariants(limit);
      return all.map(v => ({ name: v.name, confidence: 0.9 }));
    } catch (err) {
      logger.error("[VariantService] Failed to list all variants", err);
      throw err;
    }
  }
}




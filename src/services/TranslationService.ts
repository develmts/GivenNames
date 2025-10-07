// Versio 4
// TranslationService.ts
import { GivenNamesORM } from "@/orm/GivenNamesORM.js";
import Logger from "@/utils/logger.js";

const logger = Logger.get();

export interface TranslationDTO {
  nameId: number;
  translatedNameId: number;
  locale: string;
}

export interface TranslationCandidate {
  name: string;
  locale: string;
  confidence: number;
}

export class TranslationService {
  private orm: GivenNamesORM;

  constructor() {
    this.orm = GivenNamesORM.connect()
  }

  /**
   * Add a translation for a given name.
   */
  addTranslation(dto: TranslationDTO): void {
    try {
      this.orm.addTranslation(dto.nameId, dto.translatedNameId, dto.locale);
      logger.info(
        `[TranslationService] Added translation: nameId=${dto.nameId}, translatedNameId=${dto.translatedNameId}, locale=${dto.locale}`
      );
    } catch (err) {
      logger.error(
        `[TranslationService] Failed to add translation for nameId=${dto.nameId} → translatedNameId=${dto.translatedNameId}`,
        err
      );
      throw err;
    }
  }

  /**
   * Remove a translation between two names.
   */
  removeTranslation(nameId: number, translatedNameId: number): void {
    try {
      this.orm.removeTranslation(nameId, translatedNameId);
      logger.info(
        `[TranslationService] Removed translation: nameId=${nameId}, translatedNameId=${translatedNameId}`
      );
    } catch (err) {
      logger.error(
        `[TranslationService] Failed to remove translation for nameId=${nameId} → translatedNameId=${translatedNameId}`,
        err
      );
      throw err;
    }
  }

  /**
   * Get all translations for a specific nameId.
   */
  getTranslations(nameId: number): any[] {
    try {
      const translations = this.orm.getTranslations(nameId);
      logger.debug(
        `[TranslationService] Retrieved ${translations.length} translations for nameId=${nameId}`
      );
      return translations;
    } catch (err) {
      logger.error(
        `[TranslationService] Failed to get translations for nameId=${nameId}`,
        err
      );
      throw err;
    }
  }

  /**
   * Get the "translation group" of a name (all connected names).
   */
  getTranslationGroup(nameId: number): any[] {
    try {
      const visited = new Set<number>();
      const stack = [nameId];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (!visited.has(current)) {
          visited.add(current);
          const neighbors = this.orm.getTranslations(current).map(t => t.id);
          neighbors.forEach(n => {
            if (!visited.has(n)) stack.push(n);
          });
        }
      }

      logger.debug(
        `[TranslationService] Computed translation group for nameId=${nameId}, size=${visited.size}`
      );
      return Array.from(visited);
    } catch (err) {
      logger.error(
        `[TranslationService] Failed to compute translation group for nameId=${nameId}`,
        err
      );
      throw err;
    }
  }

  /**
   * List all translations in the database (useful for admin/debug).
   */
  listAll(limit = 100): any[] {
    try {
      const translations = this.orm.listAllTranslations(limit);
      logger.debug(
        `[TranslationService] Retrieved ${translations.length} total translations`
      );
      return translations;
    } catch (err) {
      logger.error("[TranslationService] Failed to list translations", err);
      throw err;
    }
  }


  
  /**
   * 🔎 Funció per NameEnrichmentService.
   * Retorna candidats de traduccions per un nom donat (manuals + DB).
   */
  findTranslations(
    name: string,
    locale: string,
    gender: string,
    manualTranslations?: { name: string; locale: string }[]
  ): TranslationCandidate[] {
    const candidates: TranslationCandidate[] = [];

    // 1️⃣ Traduccions manuals
    if (manualTranslations && manualTranslations.length > 0) {
      for (const mt of manualTranslations) {
        candidates.push({ name: mt.name, locale: mt.locale, confidence: 0.5 });
        logger.debug(`[TranslationService] Added manual translation candidate: ${mt.name} (${mt.locale})`);
      }
    }

    // 2️⃣ Traduccions confirmades a DB
    try {
      const dbTranslations = this.orm.getTranslationsByName(name, locale, gender);
      for (const t of dbTranslations) {
        candidates.push({ name: t.name, locale: t.locale, confidence: 0.9 });
      }
      logger.debug(`[TranslationService] Found ${dbTranslations.length} DB translations for ${name}`);
    } catch (err) {
      logger.error(`[TranslationService] Error fetching DB translations for ${name}`, err);
    }

    // 🔮 3️⃣ [futur] Heurístiques (per ex. comparació de diccionaris offline)

    return candidates;
  }
}

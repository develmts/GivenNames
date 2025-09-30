import {
  AbstractDecorator,
  NameContext,
  PersistedRelations,
  BaseCandidate,
  DecoratorMeta,
} from "@/decorators/AbstractDecorator";

export interface TranslationCandidate extends BaseCandidate {
  name: string;
  locale: string;
}

// Metadata for identification
const TRANSLATION_DECORATOR_META: DecoratorMeta = {
  id: "translation-decorator",
  kind: "translation",
  priority: 20,
};

export class TranslationDecorator extends AbstractDecorator<TranslationCandidate> {
  constructor() {
    super(TRANSLATION_DECORATOR_META, {
      enabled: true,
      maxCandidates: 30,
      minConfidence: 0.4,
    });
  }

  /**
   * Generates raw translation proposals:
   * 1. Manual translations provided in context.
   * 2. Heuristic rules for common name equivalents.
   * 3. Locale-based fallbacks.
   */
  protected async proposeRaw(
    ctx: NameContext,
    persisted: PersistedRelations
  ): Promise<TranslationCandidate[]> {
    const proposals: TranslationCandidate[] = [];

    // 1) Manual translations
    if ((ctx as any).manualTranslations && Array.isArray((ctx as any).manualTranslations)) {
      for (const t of (ctx as any).manualTranslations) {
        if (t && t.name && t.locale) {
          proposals.push({
            name: t.name,
            locale: t.locale,
            confidence: 0.5,
            source: "manual",
            rationale: "Manually provided translation",
          });
        }
      }
    }

    // 2) Heuristic: simple mapping examples (can be extended with dictionary)
    const mapping: Record<string, Record<string, string>> = {
      "john": { es: "juan", fr: "jean", it: "giovanni" },
      "mary": { es: "maria", fr: "marie", it: "maria" },
    };

    const base = ctx.name.toLowerCase();
    if (mapping[base]) {
      for (const [loc, transName] of Object.entries(mapping[base])) {
        proposals.push({
          name: transName,
          locale: loc,
          confidence: 0.7,
          source: "heuristic",
          rationale: "Heuristic dictionary mapping",
        });
      }
    }

    // 3) Locale-based fallback: same name in different locale
    if (ctx.locale !== "en") {
      proposals.push({
        name: ctx.name,
        locale: "en",
        confidence: 0.4,
        source: "heuristic",
        rationale: "Fallback: same name in English locale",
      });
    }

    // 4) Future external API integration (stubbed)
    // const apiTranslations = await externalTranslationApi(ctx.name, ctx.locale);
    // proposals.push(...apiTranslations);

    return proposals;
  }

  /**
   * Deduplication key combines name and locale.
   */
  protected getKey(p: TranslationCandidate): string {
    return `${p.name.toLowerCase()}|${p.locale.toLowerCase()}`;
  }

  /**
   * Checks if the candidate translation already exists in persisted relations.
   */
  protected inPersisted(
    persisted: PersistedRelations,
    p: TranslationCandidate
  ): boolean {
    return persisted.translations.some(
      (t) =>
        t.name.toLowerCase() === p.name.toLowerCase() &&
        t.locale.toLowerCase() === p.locale.toLowerCase()
    );
  }
}

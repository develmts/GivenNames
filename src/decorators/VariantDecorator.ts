import {
  AbstractDecorator,
  NameContext,
  PersistedRelations,
  BaseCandidate,
  DecoratorMeta,
} from "@/decorators/AbstractDecorator";

// 🔹 Tipus específic per variants
export interface VariantCandidate extends BaseCandidate {
  name: string;
  locale?: string; // pot ser indefinit si és manual/heurístic
}

// 🔹 Metadades per identificar aquest decorador
const VARIANT_DECORATOR_META: DecoratorMeta = {
  id: "variant-decorator",
  kind: "variant",
  priority: 10,
};

export class VariantDecorator extends AbstractDecorator<VariantCandidate> {
  constructor() {
    super(VARIANT_DECORATOR_META, {
      enabled: true,
      maxCandidates: 50,
      minConfidence: 0.4,
    });
  }

  /**
   * Genera propostes brutes de variants (manuals, heurístiques, externes).
   * Encara no aplica dedupe ni filtres; això ho fa la classe base.
   */
  protected async proposeRaw(
    ctx: NameContext,
    persisted: PersistedRelations
  ): Promise<VariantCandidate[]> {
    const proposals: VariantCandidate[] = [];

    // Exemple: variants manuals passades via meta
    // (pots injectar-les al ctx.meta o a persisted segons disseny)
    if ((ctx as any).manualVariants && Array.isArray((ctx as any).manualVariants)) {
      for (const mv of (ctx as any).manualVariants) {
        proposals.push({
          name: mv,
          confidence: 0.5,
          source: "manual",
          rationale: "Afegida manualment per usuari",
        });
      }
    }

    //  Exemple: heurística senzilla → noms sense accents
    const normalized = this.stripAccents(ctx.name);
    if (normalized !== ctx.name) {
      proposals.push({
        name: normalized,
        locale: ctx.locale,
        confidence: 0.6,
        source: "heuristic",
        rationale: "Normalització sense accents",
      });
    }

    //  Exemple: consulta a API externa (stub per ara)
    // Aquí hi aniria una crida real a Wikidata/Glosbe/etc.
    // const apiVariants = await externalApiFetch(ctx.name, ctx.locale);
    // proposals.push(...apiVariants);

    return proposals;
  }

  /**
   * Retorna una clau única per fer dedupe entre candidats.
   * Inclou locale si està present.
   */
  protected getKey(p: VariantCandidate): string {
    return `${p.name.toLowerCase()}|${p.locale ?? ""}`;
  }

  /**
   * Determina si un candidat ja existeix a les variants persistides.
   * Es compara el nom (i opcionalment locale).
   */
  protected inPersisted(
    persisted: PersistedRelations,
    p: VariantCandidate
  ): boolean {
    return persisted.variants.some((v) => {
      const sameName = v.name.toLowerCase() === p.name.toLowerCase();
      const sameLocale = !p.locale || !v.locale || v.locale === p.locale;
      return sameName && sameLocale;
    });
  }

  /**
   * Funció auxiliar per eliminar accents/diacrítics.
   */
  private stripAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}

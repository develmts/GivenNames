// export default abstract class AbstractDecorator {

// }

// Si encara no tens alias "@", canvia els imports a relatius si cal.
export type DecoratorKind = "variant" | "translation" | "cluster" | "other";
export type CandidateSource = "manual" | "heuristic" | "external";

export interface NameContext {
  id?: number;
  name: string;
  locale: string;
  gender: string;
}

export interface PersistedVariant { id?: number; name: string; locale?: string }
export interface PersistedTranslation { id?: number; name: string; locale: string }
export interface PersistedCluster { id?: number; label: string }

export interface PersistedRelations {
  variants: PersistedVariant[];
  translations: PersistedTranslation[];
  clusters: PersistedCluster[];
}

export interface BaseCandidate {
  confidence: number;               // 0..1
  source: CandidateSource;          // manual | heuristic | external
  rationale?: string;               // breu explicació (opcional)
  meta?: Record<string, unknown>;   // dades addicionals (opcional)
}

export interface DecoratorConfig {
  enabled: boolean;
  maxCandidates: number;     // límit dur (després de dedupe/filters)
  minConfidence: number;     // filtra propostes febles
  dedupeCaseInsensitive: boolean;
}

export interface DecoratorMeta {
  id: string;                // identificador únic del decorador
  kind: DecoratorKind;       // variant | translation | cluster | other
  priority: number;          // per ordenar al Broker
  dependsOn?: DecoratorKind[]; // si necessita resultats previs d'altres tipus
}

export const DEFAULT_DECORATOR_CONFIG: DecoratorConfig = {
  enabled: true,
  maxCandidates: 50,
  minConfidence: 0.35,
  dedupeCaseInsensitive: true,
};

/**
 * Classe base per a tots els Decorators.
 * - Orquestra el cicle comú: generate → normalize/filter → dedupe → clamp/limit.
 * - Delega als fills:
 *   - proposeRaw(): com generar propostes
 *   - getKey(): clau de dedupe per candidat
 *   - inPersisted(): com saber si ja existeix a DB
 */
export abstract class AbstractDecorator<TProposal extends BaseCandidate> {
  readonly meta: DecoratorMeta;
  readonly config: DecoratorConfig;

  constructor(
    meta: DecoratorMeta,
    config?: Partial<DecoratorConfig>,
  ) {
    this.meta = meta;
    this.config = { ...DEFAULT_DECORATOR_CONFIG, ...(config ?? {}) };
  }

  /**
   * Entrypoint comú cridat pel Broker.
   */
  async propose(
    ctx: NameContext,
    persisted: PersistedRelations,
  ): Promise<TProposal[]> {
    if (!this.config.enabled) return [];

    // 1) Generació bruta específica del decorador
    const raw = await this.proposeRaw(ctx, persisted);

    // 2) Normalització + filtre per confiança
    const filtered = raw
      .map((p) => this.normalize(p))
      .filter((p) => this.clampConfidence(p).confidence >= this.config.minConfidence);

    // 3) Dedup: contra persistit i entre candidats
    const withoutPersisted = filtered.filter(
      (p) => !this.inPersisted(persisted, p)
    );
    const unique = this.uniqueByKey(withoutPersisted);

    // 4) Tall final
    return unique.slice(0, this.config.maxCandidates);
  }

  /**
   * Genera propostes específiques del decorador (heurístiques, APIs, regles…)
   * NO ha de deduplicar contra DB ni limitar; això ho fa la base.
   */
  protected abstract proposeRaw(
    ctx: NameContext,
    persisted: PersistedRelations,
  ): Promise<TProposal[]> | TProposal[];

  /**
   * Retorna una clau estable per deduplicació (p. ex. "name|locale").
   */
  protected abstract getKey(p: TProposal): string;

  /**
   * Indica si el candidat ja existeix a les relacions persistides.
   * (Cada decorador sap com comparar-se contra la seva taula/relacions).
   */
  protected abstract inPersisted(
    persisted: PersistedRelations,
    p: TProposal
  ): boolean;

  /**
   * Normalitza valors textuals per a comparacions robustes (accents/case).
   * Per defecte, només retorna el mateix candidat; els fills poden sobreescriure.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected normalize(p: TProposal): TProposal {
    return p;
  }

  /**
   * Assegura que confidence estigui dins [0,1].
   */
  protected clampConfidence(p: TProposal): TProposal {
    if (p.confidence < 0) p.confidence = 0;
    if (p.confidence > 1) p.confidence = 1;
    return p;
  }

  /**
   * Dedup entre candidats utilitzant getKey() i (opcionalment) lowercasing.
   */
  protected uniqueByKey(items: TProposal[]): TProposal[] {
    const seen = new Set<string>();
    const out: TProposal[] = [];
    for (const it of items) {
      const rawKey = this.getKey(it);
      const key = this.config.dedupeCaseInsensitive
        ? rawKey.toLowerCase()
        : rawKey;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    }
    return out;
  }
}

import {
  NameContext,
  PersistedRelations,
} from "@/decorators/AbstractDecorator.js";
import { VariantDecorator, VariantCandidate } from "@/decorators/VariantDecorator.js";
import { TranslationDecorator, TranslationCandidate } from  "@/decorators/TranslationDecorator.js"
import { ClusterDecorator, ClusterCandidate } from "@/decorators/ClusterDecorator.js";

export interface DecoratedResult {
  name: string;
  locale: string;
  gender: string;
  variants: VariantCandidate[];
  translations: TranslationCandidate[];
  clusters: ClusterCandidate[];
}

/**
 * Orchestrates all decorators and merges their results.
 */
export class DecoratorBroker {
  private variantDecorator: VariantDecorator;
  private translationDecorator: TranslationDecorator;
  private clusterDecorator: ClusterDecorator;

  constructor() {
    this.variantDecorator = new VariantDecorator();
    this.translationDecorator = new TranslationDecorator();
    this.clusterDecorator = new ClusterDecorator();
  }

  /**
   * Runs all decorators in sequence and returns a merged result.
   */
  async decorateAll(
    ctx: NameContext,
    persisted: PersistedRelations
  ): Promise<DecoratedResult> {
    const [variants, translations, clusters] = await Promise.all([
      this.variantDecorator.propose(ctx, persisted),
      this.translationDecorator.propose(ctx, persisted),
      this.clusterDecorator.propose(ctx, persisted),
    ]);

    return {
      name: ctx.name,
      locale: ctx.locale,
      gender: ctx.gender,
      variants,
      translations,
      clusters,
    };
  }
}

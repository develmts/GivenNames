
// Versio 4
// import { GivenNamesORM } from "../db/GivenNamesORM";
import Logger from "@/utils/logger";
import { VariantService } from "@/services/VariantService";
import { TranslationService } from "@/services/TranslationService";
import { ClusterService } from "@/services/ClusterService";

const logger = Logger.get();

export interface DecoratorInput {
  name: string;
  locale: string;
  gender: string;
  source?: string;
  variants?: string[];                          // noms proposats manualment
  translations?: { name: string; locale: string }[];
  clusters?: string[];                          // clusters proposats manualment
}

export interface VariantCandidate {
  name: string;
  confidence: number;
}

export interface TranslationCandidate {
  name: string;
  locale: string;
  confidence: number;
}

export interface ClusterCandidate {
  label: string;
  confidence: number;
}

export interface DecoratorResult {
  name: string;
  locale: string;
  gender: string;
  variants: VariantCandidate[];
  translations: TranslationCandidate[];
  clusters: ClusterCandidate[];
}

export class NameDecoratorService {
  // private variantService: VariantService;
  // private translationService: TranslationService;
  // private clusterService: ClusterService;

  // constructor(orm: GivenNamesORM) {
  //   this.variantService = new VariantService(orm);
  //   this.translationService = new TranslationService(orm);
  //   this.clusterService = new ClusterService(orm);
  // }

  constructor(
    private variantService: VariantService,
    private translationService: TranslationService,
    private clusterService: ClusterService
  ) {}


  decorate(input: DecoratorInput): DecoratorResult {
    logger.info(`[Decorator] Processing name=${input.name}, locale=${input.locale}`);

    // 1️⃣ Variants
    const variantCandidates = this.variantService.findVariants(
      input.name,
      input.locale,
      input.gender,
      input.variants
    );

    // 2️⃣ Translations
    const translationCandidates = this.translationService.findTranslations(
      input.name,
      input.locale,
      input.gender,
      input.translations
    );

    // 3️⃣ Clusters (s’aplica la regla: nom ∨ variants ∨ translations)
    const clusterCandidates = this.clusterService.findClusters(
      input.name,
      input.locale,
      input.gender,
      input.clusters,
      variantCandidates,
      translationCandidates
    );

    return {
      name: input.name,
      locale: input.locale,
      gender: input.gender,
      variants: variantCandidates,
      translations: translationCandidates,
      clusters: clusterCandidates,
    };
  }
}

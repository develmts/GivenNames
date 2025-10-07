import {
  AbstractDecorator,
  NameContext,
  PersistedRelations,
  BaseCandidate,
  DecoratorMeta,
} from "@/decorators/AbstractDecorator.js";

export interface ClusterCandidate extends BaseCandidate {
  label: string;
}

// Metadata for identification
const CLUSTER_DECORATOR_META: DecoratorMeta = {
  id: "cluster-decorator",
  kind: "cluster",
  priority: 30,
};

export class ClusterDecorator extends AbstractDecorator<ClusterCandidate> {
  constructor() {
    super(CLUSTER_DECORATOR_META, {
      enabled: true,
      maxCandidates: 20,
      minConfidence: 0.4,
    });
  }

  /**
   * Generates raw cluster proposals based on:
   * 1. Manual clusters supplied in context.
   * 2. Heuristic rules (prefix/suffix, common cultural categories).
   * 3. Fallback based on name + locale.
   */
  protected async proposeRaw(
    ctx: NameContext,
    persisted: PersistedRelations
  ): Promise<ClusterCandidate[]> {
    const proposals: ClusterCandidate[] = [];

    // 1) Manual clusters (if supplied in context)
    if ((ctx as any).manualClusters && Array.isArray((ctx as any).manualClusters)) {
      for (const cluster of (ctx as any).manualClusters) {
        proposals.push({
          label: cluster,
          confidence: 0.5,
          source: "manual",
          rationale: "Manually provided cluster",
        });
      }
    }

    // 2) Heuristic: biblical or cultural categories by common names
    const lowered = ctx.name.toLowerCase();
    if (["maria", "jose", "jesus", "john"].includes(lowered)) {
      proposals.push({
        label: "biblical",
        confidence: 0.7,
        source: "heuristic",
        rationale: "Detected common biblical name",
      });
    }
    if (lowered.endsWith("ov") || lowered.endsWith("ova")) {
      proposals.push({
        label: "slavic",
        confidence: 0.6,
        source: "heuristic",
        rationale: "Suffix suggests Slavic origin",
      });
    }

    // 3) Locale-based heuristic
    if (ctx.locale === "es") {
      proposals.push({
        label: "spanish",
        confidence: 0.6,
        source: "heuristic",
        rationale: "Locale is 'es'",
      });
    }
    if (ctx.locale === "fr") {
      proposals.push({
        label: "french",
        confidence: 0.6,
        source: "heuristic",
        rationale: "Locale is 'fr'",
      });
    }

    // 4) Future external API (stubbed for now)
    // const apiClusters = await externalClusterApi(ctx.name, ctx.locale);
    // proposals.push(...apiClusters);

    return proposals;
  }

  /**
   * Deduplication key based on cluster label.
   */
  protected getKey(p: ClusterCandidate): string {
    return p.label.toLowerCase();
  }

  /**
   * Determines if the candidate cluster is already persisted.
   */
  protected inPersisted(
    persisted: PersistedRelations,
    p: ClusterCandidate
  ): boolean {
    return persisted.clusters.some(
      (c) => c.label.toLowerCase() === p.label.toLowerCase()
    );
  }
}

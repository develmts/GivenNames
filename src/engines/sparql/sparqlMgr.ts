// Version 4
// src/v4/engines/sparqlMgr.ts
// import fetch from "node-fetch";
import path from "path";
import { EngineBase } from "@/engines/EngineBase";
import { slugify } from "@/engines/utils/slug";
import Logger from "@/engines/utils/logger";

import { basicNamesQuery, variantsQuery, translationsQuery } from "@/engines/sparql/sparqlQueries";

const logger = Logger.get();

interface QueryMetadata {
  locale: string;
  gender: string;
  source_query: string;
  source_slug: string;
}


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * sparqlMgr
 * ---------
 * Motor per a executar consultes SPARQL contra Wikidata i
 * desa els resultats a data/raw en el mateix format que els crawlers.
 */
export class SparqlMgr extends EngineBase {
  protected source = "wikidata";
  private endpoint = "https://query.wikidata.org/sparql";
  private delayMs = this.config.sparql.rateLimitMs 

  async runFromCLI(): Promise<void> {
    // ⚠️ Exemple: consulta bàsica. En un futur pots llegir consultes d'arxiu.
    const query = `
      SELECT ?item ?itemLabel WHERE {
        ?item wdt:P31 wd:Q202444. # instance of: given name
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ca,en". }
      }
      LIMIT 50
    `;

    logger.info(`[sparqlMgr] Running SPARQL query...`);
    const rows = await this.runSPARQL(query);

    const names = rows.map((r: any) => r.itemLabel.value);
    const meta: QueryMetadata = {
      locale: this.config.locale || "unknown",
      gender: "n", // neutral per defecte; es pot millorar
      source_query: query.trim(),
      source_slug: slugify("wikidata-query"),
    };

    this.saveResults(`wikidata-${meta.locale}`, names, meta);
  }

  private async runSPARQL(query: string): Promise<any[]> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/json",
        "User-Agent": "GivenNamesV4/0.1 (https://github.com/yourproject)" // 👈 per ser bon ciutadà
      },
      body: query,
    });

    if (!res.ok) {
      throw new Error(`[sparqlMgr] SPARQL query failed: ${res.statusText}`);
    }

    const data = await res.json();

    await sleep(this.delayMs);

    return data.results.bindings;
  }
}

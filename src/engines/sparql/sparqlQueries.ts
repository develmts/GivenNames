// Version 4
/**
 * sparqlQueries.ts
 * ----------------
 * Conjunt de consultes SPARQL parametritzades per Wikidata.
 */

/**
 * Consulta bàsica de noms de pila per idioma i gènere.
 * @param genderQid QID del gènere (ex: Q12308941 femení, Q12308935 masculí)
 * @param lang llengua principal (ex: "ca", "es", "fr")
 */
export function basicNamesQuery(genderQid: string, lang = "en"): string {
  return `
    SELECT ?name ?nameLabel WHERE {
      ?name wdt:P31 wd:Q202444;    # instance of → given name
            wdt:P279 wd:${genderQid}. # subclass of → gendered given name
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }
    }
    LIMIT 200
  `;
}

/**
 * Consulta per variants ortogràfiques (said to be the same as).
 */
export function variantsQuery(lang = "en"): string {
  return `
    SELECT ?name ?nameLabel ?variant ?variantLabel WHERE {
      ?name wdt:P31 wd:Q202444.
      ?name wdt:P460 ?variant.     # said to be the same as
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }
    }
    LIMIT 200
  `;
}

/**
 * Consulta per traducciones / labels multilingües.
 * @param langs llista de codis d'idioma separats per comes (ex: "ca,es,fr,en")
 */
export function translationsQuery(langs = "ca,es,fr,en"): string {
  return `
    SELECT ?name ?nameLabel WHERE {
      ?name wdt:P31 wd:Q202444.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${langs}" }
    }
    LIMIT 200
  `;
}

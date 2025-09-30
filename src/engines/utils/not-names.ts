// non-names.ts
// Version 4.0

// Llista de paraules que no són noms propis, per filtrar falsos positius
// Inclou termes comuns en navegació web, contingut no nominal, publicitat, etc.

// Aquesta llista es pot ampliar segons sigui necessari per millorar la precisió
// de l'extracció de noms propis.
export const NEGATIVE_WORDS: string[] = [
  // Navegació i estructura web
  "home", "inicio", "accueil", "menu", "contact", "contatti", "contacte", "login", "logout", "register", "signup",
  "profile", "account", "cookie", "cookies", "privacy", "terms", "sitemap", "faq", "rss", "about", "info", "newsletter",

  // Elements de contingut no nominal
  "tendència", "trend", "ranking", "popular", "novetats", "novità", "ultimes", "últimas", "últims", "novedades", 
  "último", "última", "nuevo", "nueva", "recent", "recente", "curiosità", "notizie", "news",

  // Publicitat i xarxes
  "publicitat", "pubblicità", "ads", "ad", "sponsor", "segui", "seguici", "follow", "share", "tweet", "like",

  // Altres paraules freqüents no relacionades amb noms
  "sondaggio", "enquesta", "encuesta", "vote", "vota", "resultats", "risultati", "resultados", "language", "idioma",

  // Ja existents
  "nomix", "calcolatori", "nomignoli", "pets", "accedi", "registrati", "posizione", "tendenza",
  "browserhappy", "iscrivimi", "sondaggio", "social", "pubblicità", "disclaimer", "cookie", "contatti",

  // Ad Hoc
  "publicité","recrutement"

];

export const NOT_NAMES_UI = [
  "Menu", "Navigation", "Article", "Discussion", "Modifier", "Outils",
  "Communauté", "Portail", "Projet", "Catégorie", "Pages spéciales",
  "Statistiques", "Version mobile"
];

export const NOT_NAMES_LANGS = [
  "Afrikaans","Alemannisch","Aragonés","Azərbaycanca","Boarisch","Brezhoneg",
  "Bosanski","Català","Dansk","Deutsch","English","Esperanto","Español",
  "Eesti","Føroyskt","Frysk","Galego","Hornjoserbsce","Magyar","Italiano",
  "Latina","Latviešu","Plattdüütsch","Nederlands","Norsk nynorsk",
  "Norsk bokmål","Polski","Português","Română","Slovenčina","Slovenščina",
  "Svenska","Türkçe","Vèneto","Wiktionnaire"
];

// Export unified list
export const NOT_NAMES = [ ...NEGATIVE_WORDS, ...NOT_NAMES_UI, ...NOT_NAMES_LANGS];

export function isBlacklisted(name: string, verbose = false): boolean {
  if (NOT_NAMES_UI.some(w => w.toLowerCase() === name.toLowerCase())) {
    if (verbose) console.log(`[discard] "${name}" (blacklist: UI)`);
    return true;
  }
  if (NOT_NAMES_LANGS.some(l => l.toLowerCase() === name.toLowerCase())) {
    if (verbose) console.log(`[discard] "${name}" (blacklist: language)`);
    return true;
  }
  return false;
}
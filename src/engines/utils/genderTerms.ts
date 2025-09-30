// genderTerms.ts 
// Versio 4
// Taula de termes per inferència de gènere per idioma, incloent singulars i plurals

export const GENDER_TERMS_BY_LOCALE: Record<string, { male: string[]; female: string[], neutral:string[]}> = {
  "es": {
    male: ["niño", "niños", "chico", "chicos", "hombre", "hombres", "varón", "varones"],
    female: ["niña", "niñas", "chica", "chicas", "mujer", "mujeres", "hembra", "hembras"],
    neutral: ["unisex", "neutro"]
  },
  "ca": {
    male: ["nen", "nens", "noi", "nois", "home", "homes", "masculi", "masculins"],
    female: ["nena", "nenes", "noia", "noies", "dona", "dones", "femeni", "femenins"],
    neutral: ["unisex", "neutre"]
  },
  "en": {
    male: ["boy", "boys", "man", "men", "male", "males"],
    female: ["girl", "girls", "woman", "women", "female", "females"],
    neutral: ["unisex", "neutral"]
  },
  "fr": {
    male: ["garçon", "garçons", "homme", "hommes", "mâle", "mâles", "masculin"],
    female: ["fille", "filles", "femme", "femmes", "femelle", "femelles", "femenin"],
    neutral: ["unisex"]
  },
  "it": {
    male: ["ragazzo", "ragazzi", "uomo", "uomini", "maschio", "maschi","maschile"],
    female: ["ragazza", "ragazze", "donna", "donne", "femmina", "femmine","femminili"],
    neutral: ["unisex"]
  },
  "pt": {
    male: ["menino", "meninos", "rapaz", "rapazes", "homem", "homens"],
    female: ["menina", "meninas", "rapariga", "raparigas", "mulher", "mulheres"],
    neutral: ["unisex"]
  },
  "de": {
    male: ["junge", "jungen", "mann", "männer", "kerl", "kerle"],
    female: ["mädchen", "mädchen", "frau", "frauen", "weiblich"],
    neutral: ["unisex"]
  },
  // Default / fallback
  "und": {
    male: ["boy", "boys", "man", "men", "male", "males"],
    female: ["girl", "girls", "woman", "women", "female", "females"],
    neutral: ["unisex"]
  }
 
};

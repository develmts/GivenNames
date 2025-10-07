
// Versio 5

import { GENDER_TERMS_BY_LOCALE } from '@/engines/utils/genderTerms.js';

export type Gender = 'male' | 'female' | 'neutral' | 'unknown';

export interface GenderResult {
  gender: Gender;
  source: string;
}

const knownUnisexNames = new Set([
  'alex', 'sam', 'taylor', 'sasha', 'noa', 'kim', 'chris', 'casey', 'morgan', 'jamie',
  'jordan', 'ashley', 'jesse', 'skyler', 'riley', 'robin', 'drew', 'charlie', 'devon'
]);

const femaleSuffixes = [
  'a', 'na', 'ina', 'ita', 'ella', 'ette', 'ine', 'sia', 'cia',
  'lya', 'ra', 'ta', 'isa', 'lina', 'ika', 'sha', 'ka', 'eva', 'ara'
];

const maleSuffixes = [
  'o', 'os', 'io', 'us', 'an', 'el', 'iel', 'er', 'as', 'is', 'or', 'on'
];

function normalizeName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}


/**
 * Infers gender from a single name based on common suffixes.
 */
export function inferGender(name: string, locale?: string): GenderResult {
  const lowered = name.toLowerCase();
  if (!locale) locale = 'und';
  // Intentem identificar el gènere segons paraules clau per idioma
  for (const lang of locale) {
    const terms = GENDER_TERMS_BY_LOCALE[lang];
    if (!terms) continue;

    for (const masculine of terms.male) {
      if (lowered.includes(masculine.toLowerCase())) return { gender: 'male', source: 'terms-pattern' }
    }
    for (const feminine of terms.female) {
      if (lowered.includes(feminine.toLowerCase())) return { gender: 'female', source: 'terms-pattern' }
    }
    for (const neutral of terms.neutral) {
      if (lowered.includes(neutral.toLowerCase())) return { gender: 'neutral', source: 'terms-pattern' }
    }
  }

  //return ''; // No identificat
  return { gender: 'unknown', source: 'terms-pattern' }
}

/**
 * Infers namelist gender from the URL/URI based on common suffixes.
 */
export function inferGenderFromURI(uri: string, locale?: string): GenderResult {
  if (!locale) 
    locale = 'und';

  const terms = GENDER_TERMS_BY_LOCALE[locale.split('-')[0]];

  const tURI = new URL(uri);
  const tokens = tURI.pathname.split(/\//)

  let res: GenderResult = {gender: 'unknown', source: 'terms-pattern'};

  for (const token of tokens) {
    const cleanDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const loweredToken = cleanDiacritics(token.toLowerCase());

    for (const lang of [locale]) {

      for (const masculine of terms.male) {
        if (loweredToken.includes(masculine.toLowerCase())) {
          res= { gender: 'male', source: 'terms-pattern' }
          break
        }
      }
      for (const feminine of terms.female) {
        if (loweredToken.includes(feminine.toLowerCase())) {
          res = { gender: 'female', source: 'terms-pattern' }
          break
        }
      }
      for (const neutral of terms.neutral) {
        if (loweredToken.includes(neutral.toLowerCase())) {
          res = { gender: 'neutral', source: 'terms-pattern' }
          break
        }
      }
    }
  }
  return res

}


/**
 * Tries to infer the most likely gender from a list of names.
 * Returns 'female' or 'male' if the majority is clearly in favor, otherwise 'unknown'.
 */
export function inferGenderFromNameList(names: string[], locale?: string): GenderResult {
  let maleCount = 0;
  let femaleCount = 0;
  let neutralCount = 0;

  for (const name of names) {
    const inferred = inferGender(name, locale);
    if (inferred.gender === 'male') maleCount++;
    else if (inferred.gender === 'female') femaleCount++;
    else if (inferred.gender === 'neutral') neutralCount++;
  }

  const total = maleCount + femaleCount + neutralCount;
  if (total === 0) return { gender: 'unknown', source: 'statistical' };

  const ratio = Math.max(maleCount, femaleCount, neutralCount) / total;
  if (ratio < 0.7) return { gender: 'unknown', source: 'statistical' };

  let localGender: Gender = 'unknown' //maleCount > femaleCount ? 'male' : 'female';
  if (maleCount > femaleCount && maleCount > neutralCount) localGender = 'male'
  if (femaleCount > maleCount && femaleCount > neutralCount) localGender = 'female'
  if (neutralCount > maleCount && neutralCount > femaleCount) localGender = 'neutral'
  
  return { gender: localGender, source: 'statistical' }
}

/**
 * Extract gender from metadata, filename, lang, or other hints.
 */
export function inferGenderFromMetadata(name: string, meta?: Record<string, any>): GenderResult {
  const normalizedName = normalizeName(name);

  // 1. From metadata line (assumes normalized input)
  if (meta?.gender && ['male', 'female', 'neutral'].includes(meta.gender)) {
    return { gender: meta.gender, source: 'metadata' };
  }

  // 2. From filename suffix (e.g., -F.txt or boys_, girls_)
  const urlId = meta?.urlId || '';
  if (urlId.match(/[-_](F|female|girls?)/i)) return { gender: 'female', source: 'filename-pattern' };
  if (urlId.match(/[-_](M|male|boys?)/i)) return { gender: 'male', source: 'filename-pattern' };
  if (urlId.match(/[-_](N|neutral|unisex?)/i)) return { gender: 'neutral', source: 'filename-pattern' };

  // 3. From lang hints (useful in future)
  const lang = (meta?.lang || '').toLowerCase();
  // if (lang === 'ar' || lang === 'fa') return { gender: 'male', source: 'lang:likely-male' };
  // if (lang === 'fr' || lang === 'it') return { gender: 'female', source: 'lang:likely-female' };

  // 4. From name itself
  const inferred : GenderResult = inferGender(name);
  const source = knownUnisexNames.has(normalizedName)
    ? 'unisex-known'
    : `suffix:${inferred.gender}`;

  return { 'gender': inferred.gender, source: source}
  
}
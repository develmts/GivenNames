// nameExtractor.ts — versió 5

// import { NEGATIVE_WORDS } from './non-names';
import { NOT_NAMES_UI, NOT_NAMES_LANGS, NOT_NAMES,isBlacklisted } from "./not-names";

export interface ExtractOptions {
  verbose?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}
const VALID_TAGS = ['a','h1', 'h2', 'h3', 'li', 'a', 'td', 'th', 'span', 'div', 'p'];


export function isValidName(text: string): ValidationResult {
  const cleaned = text.trim();
  const reasons: string[] = [];


  if (cleaned === '') reasons.push("empty");
  if (cleaned.length < 2 || cleaned.length > 50 ) reasons.push("invaliod length");
  const words = cleaned.split(/\s+/);
  if (words.length > 3) reasons.push("too many words");
  if (!/^[A-Z]/.test(words[0])) reasons.push("does not start with capital letter");
  if (words.filter(w => /^[A-Z]/.test(w)).length > 1) reasons.push("multiple capitalized words");
  // if (NEGATIVE_WORDS.includes(cleaned.toLowerCase())) reasons.push("blacklisted");
  if( isBlacklisted(cleaned, false)) reasons.push("blacklisted (UI/lang)")

      // Alphabet / regex check
  if (!/^[A-ZÁÉÍÓÚÜÑÇ][a-zàáâäãåčçèéêëìíîïñòóôöõùúûüýÿ\-'\s]+$/.test(cleaned)) 
    reasons.push("invalid characters or pattern")
  if (!/^\p{Lu}[\p{L}\p{M}\-' ]+$/u.test(cleaned)) reasons.push("fails regex");

  return {
    valid: reasons.length === 0,
    reasons
  };
}

export function extractValidNames(candidates: string[]): string[] {
  const validNames: string[] = [];

  for (const name of candidates) {
    const result = isValidName(name);
    if (result.valid) {
      validNames.push(name);
    } else {
      // TODO : Support --verbose
      //console.log(`❌ Rejected: "${name}" — reasons: ${result.reasons.join(', ')}`);
    }
  }

  return validNames;
}

function extractFromHeuristicSelectors(document: Document): string[] {
  const selectors = [
    'ul li a',
    'ol li a',
    'div.card h3',
    'div.nom h2',
    'div h2.name',
    'table tr td',
    'section h3',
  ];

  const result: string[] = [];

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));
    for (const el of elements) {
      const text = el.textContent?.trim() ?? '';
      if (isValidName(text)) {
        result.push(text);
      }
    }
  }

  return result;
}


export function extractPotentialNamesFromHTML(document: Document): string[] {

  const allElements = Array.from(document.querySelectorAll('*'));
  const names: string[] = [];

  for (const el of allElements) {
    const tag = el.tagName.toLowerCase();
    // console.log(el)
    if (!VALID_TAGS.includes(tag)) continue;

    const text = el.textContent?.trim() ?? '';
    // if (!isValidName(text)) continue;

    names.push(text);
  }

  // Also apply heuristics from common layout patterns
  names.push(...extractFromHeuristicSelectors(document));

  // return Array.from(new Set(names));
  return Array.from(new Set(extractValidNames(names)));
}
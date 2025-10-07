#!/usr/bin/env node
/**
 * Auto-fix imports using "@/..." without extension by appending ".js"
 * Run: node scripts/fix-missing-extensions.mjs
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, extname } from "path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

// Regex per detectar import/require d'@ sense extensió
const importRegex = /(from\s+["'])(@\/[^"']+)(["'])|(require\(\s*["'])(@\/[^"']+)(["']\s*\))/g;

// Extensions considerades vàlides
const validExts = [".ts", ".js", ".tsx", ".jsx"];

/**
 * Recursiu: retorna tots els fitxers ts/js
 */
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|js|tsx|jsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(SRC_DIR);
let modifiedCount = 0;

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let updated = content.replace(importRegex, (match, g1, g2, g3, g4, g5, g6) => {
    const importPath = g2 || g5;
    const ext = extname(importPath);
    if (!validExts.includes(ext)) {
      const prefix = g1 || g4;
      const suffix = g3 || g6;
      return `${prefix}${importPath}.js${suffix}`;
    }
    return match;
  });

  if (updated !== content) {
    writeFileSync(file, updated, "utf8");
    console.log(`Fixed imports in: ${file}`);
    modifiedCount++;
  }
}

console.log(`\n✅ Done. Modified ${modifiedCount} files.`);

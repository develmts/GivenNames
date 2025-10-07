#!/usr/bin/env ts-node

/**
 * Find imports using "@/..." without a file extension.
 * Run from project root: ts-node scripts/find-missing-extensions.ts
 */

import { readdirSync, statSync, readFileSync } from "fs"
import { join, extname } from "path"

const ROOT = process.cwd()
const SRC_DIR = join(ROOT, "src")

// Regex: import ... from "@/something" or require("@/something")
const importRegex = /from\s+["'](@\/[^"']+)["']|require\(\s*["'](@\/[^"']+)["']\s*\)/g

// Extensions considered valid
const validExts = [".ts", ".js", ".tsx", ".jsx"]

/**
 * Recursively walk directories
 */
function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, files)
    } else if (/\.(ts|js|tsx|jsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

const files = walk(SRC_DIR)
const problems: { file: string; importPath: string }[] = []

for (const file of files) {
  const content = readFileSync(file, "utf8")
  let match: RegExpExecArray | null
  while ((match = importRegex.exec(content)) !== null) {
    const raw = match[1] || match[2]
    if (raw) {
      const ext = extname(raw)
      if (!validExts.includes(ext)) {
        problems.push({ file, importPath: raw })
      }
    }
  }
}

if (problems.length === 0) {
  console.log("✅ No missing extensions found in @ imports")
  process.exit(0)
}

console.log("⚠️ Missing extensions in @ imports:")
for (const p of problems) {
  console.log(`- ${p.file}: ${p.importPath}`)
}
process.exit(1)

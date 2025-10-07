#!/usr/bin/env node
/**
 * Find usage of jest.* or vi.* calls (mocks, spies, etc.) in the project.
 * Usage:
 *   node scripts/find-test-mocks.mjs [directory]
 */

import { readdirSync, statSync, readFileSync } from "fs"
import { join } from "path"

const ROOT = process.argv[2] || process.cwd()

// Patterns to detect
const patterns = {
  "jest.fn": /\bjest\.fn\b/g,
  "jest.spyOn": /\bjest\.spyOn\b/g,
  "jest.mock": /\bjest\.mock\b/g,
  "jest.clearAllMocks": /\bjest\.clearAllMocks\b/g,
  "jest.restoreAllMocks": /\bjest\.restoreAllMocks\b/g,
  "jest.resetAllMocks": /\bjest\.resetAllMocks\b/g,
  "jest.requireActual": /\bjest\.requireActual\b/g,
  "jest.requireMock": /\bjest\.requireMock\b/g,
//   "vi.fn": /\bvi\.fn\b/g,
//   "vi.spyOn": /\bvi\.spyOn\b/g,
//   "vi.mock": /\bvi\.mock\b/g,
//   "vi.clearAllMocks": /\bvi\.clearAllMocks\b/g,
//   "vi.restoreAllMocks": /\bvi\.restoreAllMocks\b/g,
//   "vi.resetAllMocks": /\bvi\.resetAllMocks\b/g
}

/**
 * Recursively collect files
 */
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, files)
    } else if (/\.(ts|js|tsx|jsx|mjs|cjs)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

/**
 * Scan one file
 */
function scanFile(file) {
  const content = readFileSync(file, "utf8")
  const hits = {}
  for (const [label, regex] of Object.entries(patterns)) {
    const count = (content.match(regex) || []).length
    if (count > 0) hits[label] = count
  }
  return hits
}

const files = walk(ROOT)
const results = []

for (const file of files) {
  const found = scanFile(file)
  if (Object.keys(found).length > 0) results.push({ file, found })
}

if (results.length === 0) {
  console.log("✅ No jest.* or vi.* usages found.")
  process.exit(0)
}

console.log("⚠️ Mock/spy usages found:\n")
for (const { file, found } of results) {
  const list = Object.entries(found)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ")
  console.log(`${file} — ${list}`)
}

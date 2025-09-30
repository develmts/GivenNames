import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(process.cwd(), "src/v5");

function getAllFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractFunctions(code: string): string[] {
  const regex =
    /\b(?:function|static\s+|async\s+)?([a-zA-Z0-9_]+)\s*\(/g;
  const matches: string[] = [];
  let m;
  while ((m = regex.exec(code))) {
    matches.push(m[1]);
  }
  return matches;
}

function findUnusedFunctions() {
  const files = getAllFiles(SRC_DIR);
  const allCode = files.map(f => fs.readFileSync(f, "utf-8")).join("\n");

  const results: Record<string, string[]> = {};

  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8");
    const funcs = extractFunctions(code);

    const unused = funcs.filter(fn => {
      // Ignore test files
      if (file.includes(".test.ts")) return false;

      // Count references
      const re = new RegExp(`\\b${fn}\\b`, "g");
      const count = (allCode.match(re) || []).length;

      // if only found once (the definition itself), then unused
      return count <= 1;
    });

    if (unused.length > 0) {
      results[file] = unused;
    }
  }

  return results;
}

const unused = findUnusedFunctions();
console.log("=== Unused functions report ===");
for (const [file, funcs] of Object.entries(unused)) {
  console.log(file);
  funcs.forEach(fn => console.log("  -", fn));
}

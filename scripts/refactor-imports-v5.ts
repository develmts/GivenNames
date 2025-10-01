/* scripts/refactor-imports-remove-v5.ts */
import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import fg from "fast-glob";
import fs from "node:fs";

/**
 * Assumptions:
 * - tsconfig.json has:
 *     "baseUrl": "./src",
 *     "paths": { "@/*": ["*"] }
 * - We want to transform:
 *   - "@/src/v5/..." -> "@/..."
 *   - "@/src/..."    -> "@/..."
 *   - any relative import resolving to <repo>/src/v5/... -> "@/<rest>"
 *   - optionally, any relative import resolving to <repo>/src/...    -> "@/<rest>"
 */

const projectRoot = process.cwd();
const SRC_DIR = path.join(projectRoot, "src");
const V5_SEGMENT = `${path.sep}src${path.sep}v5${path.sep}`;
const SRC_SEGMENT = `${path.sep}src${path.sep}`;

// If absolute path points under src/*, return "@/<relToSrc>"
function toAliasFromAbs(absPath: string): string | null {
  const relToSrc = path.relative(SRC_DIR, absPath);
  if (relToSrc.startsWith("..")) return null;
  return `@/${relToSrc.replace(/\\/g, "/")}`;
}

// Normalize a module specifier given the current file directory
function normalizeSpecifier(spec: string, fileDir: string): string {
  // A) Already alias cases
  if (spec.startsWith("@/src/v5/")) {
    return spec.replace("@/src/v5/", "@/");
  }
  if (spec.startsWith("@/src/")) {
    return spec.replace("@/src/", "@/");
  }

  // B) Any spec containing "/src/v5/" or "\src\v5\"
  if (spec.includes("/src/v5/")) {
    return spec.replace("/src/v5/", "/");
  }
  if (spec.includes("\\src\\v5\\")) {
    return spec.replace("\\src\\v5\\", "\\");
  }

  // C) Relative imports: resolve and map to alias when they live under src/*
  if (spec.startsWith(".")) {
    const abs = path.resolve(fileDir, spec);
    // Keep as-is if it doesn't sit under src
    if (!abs.includes(SRC_SEGMENT)) return spec;

    // If under src/v5 -> drop 'v5'
    if (abs.includes(V5_SEGMENT)) {
      const withoutV5 = abs.replace(V5_SEGMENT, SRC_SEGMENT);
      const alias = toAliasFromAbs(withoutV5);
      if (alias) return alias;
      return spec;
    }

    // Optional: convert any path under src/* to alias "@/"
    // Comment this block out if you only want to change v5 paths
    {
      const alias = toAliasFromAbs(abs);
      if (alias) return alias;
    }

    return spec;
  }

  // D) Other alias already "@/..." (no src) -> leave as-is
  if (spec.startsWith("@/")) return spec;

  // E) Anything else -> leave unchanged
  return spec;
}

async function main() {
  // Collect TS/TSX files (extend to js/jsx if needed)
  const files = await fg(
    ["src/**/*.ts", "src/**/*.tsx"],
    { cwd: projectRoot, absolute: true, ignore: ["**/node_modules/**", "**/dist/**"] }
  );

  const project = new Project({
    tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true
  });

  for (const f of files) project.addSourceFileAtPathIfExists(f);

  let changed = 0;

  for (const sf of project.getSourceFiles()) {
    const fileDir = path.dirname(sf.getFilePath());
    let fileChanged = false;

    // Static imports
    sf.getImportDeclarations().forEach((decl) => {
      const spec = decl.getModuleSpecifierValue();
      const next = normalizeSpecifier(spec, fileDir);
      if (next !== spec) {
        decl.setModuleSpecifier(next);
        fileChanged = true;
      }
    });

    // Dynamic import("...")
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const call = node.asKindOrThrow(SyntaxKind.CallExpression);
        const expr = call.getExpression().getText();
        if (expr === "import" && call.getArguments().length === 1) {
          const arg = call.getArguments()[0];
          if (arg.getKind() === SyntaxKind.StringLiteral) {
            // @ts-expect-error ts-morph private API shape
            const spec: string = arg.getLiteralText();
            const next = normalizeSpecifier(spec, fileDir);
            if (next !== spec) {
              // @ts-expect-error ts-morph private API shape
              arg.setLiteralValue(next);
              fileChanged = true;
            }
          }
        }
      }
    });

    if (fileChanged) changed++;
  }

  if (changed > 0) {
    await project.save();
  }

  // Optional: fix CommonJS require("...") patterns in .ts (if any)
  for (const file of files) {
    const txt = fs.readFileSync(file, "utf8");
    let updated = txt;

    // "@/src/v5/..." -> "@/..."
    updated = updated.replace(
      /(require\(\s*['"])(@\/src\/v5\/)([^'"]+)(['"]\s*\))/g,
      (_m, p1, _v5, rest, p4) => `${p1}@/${rest}${p4}`
    );

    // "@/src/..." -> "@/..."
    updated = updated.replace(
      /(require\(\s*['"])(@\/src\/)([^'"]+)(['"]\s*\))/g,
      (_m, p1, _src, rest, p4) => `${p1}@/${rest}${p4}`
    );

    if (updated !== txt) fs.writeFileSync(file, updated, "utf8");
  }

  console.log(`Refactor complete. Files changed: ${changed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

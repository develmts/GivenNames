/* scripts/refactor-imports-v5.ts */
import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import fg from "fast-glob";
import fs from "node:fs";

const projectRoot = process.cwd();
const SRC_DIR = path.join(projectRoot, "src");
const V5_SEGMENT = `${path.sep}src${path.sep}v5${path.sep}`;

function toAliasFromAbs(absPath: string): string | null {
  // Convert an absolute path under src/* to @/src/*
  const relToSrc = path.relative(SRC_DIR, absPath);
  if (relToSrc.startsWith("..")) return null;
  return `@/src/${relToSrc.replace(/\\/g, "/")}`;
}

function normalizeSpecifier(spec: string, fileDir: string): string {
  // Case A: Already using alias '@/src/v5/...'
  if (spec.startsWith("@/src/v5/")) {
    return spec.replace("@/src/v5/", "@/src/");
  }

  // Case B: Any absolute-ish spec containing '/src/v5/...'
  // Example: 'src/v5/utils/x' or '/abs/.../src/v5/utils/x' (rare in TS imports)
  if (spec.includes("/src/v5/")) {
    return spec.replace("/src/v5/", "/src/");
  }

  // Case C: Relative imports that might resolve to ...src/v5/...
  if (spec.startsWith(".")) {
    const abs = path.resolve(fileDir, spec);
    const withoutExt = abs; // keep original ext as in import
    if (withoutExt.includes(V5_SEGMENT)) {
      const newAbs = withoutExt.replace(V5_SEGMENT, `${path.sep}src${path.sep}`);
      const alias = toAliasFromAbs(newAbs);
      if (alias) return alias;
    }
    // If it does not hit src/v5, leave it as is
    return spec;
  }

  // Case D: Alias already '@/src/...' but no v5 -> leave intact
  if (spec.startsWith("@/src/")) return spec;

  // Case E: Anything else -> leave as is
  return spec;
}

async function main() {
  // Collect TS/TSX files (you pots ampliar a JS/JSX si cal)
  const files = await fg(
    ["src/**/*.ts", "src/**/*.tsx"],
    { cwd: projectRoot, absolute: true, dot: false, ignore: ["**/node_modules/**", "**/dist/**"] }
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

    // import ... from "specifier"
    sf.getImportDeclarations().forEach((decl) => {
      const spec = decl.getModuleSpecifierValue();
      const next = normalizeSpecifier(spec, fileDir);
      if (next !== spec) {
        decl.setModuleSpecifier(next);
        fileChanged = true;
      }
    });

    // dynamic import("specifier")
    sf.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const call = node.asKind(SyntaxKind.CallExpression)!;
        const expr = call.getExpression().getText();
        if (expr === "import" && call.getArguments().length === 1) {
          const arg = call.getArguments()[0];
          if (arg.getKind() === SyntaxKind.StringLiteral) {
            const spec = (arg as any).getLiteralText();
            const next = normalizeSpecifier(spec, fileDir);
            if (next !== spec) {
              (arg as any).setLiteralValue(next);
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

  // Optional: also fix CommonJS require("...") in .ts files (rare but possible)
  // Simple text replacement bounded to require("...") strings only.
  for (const file of files) {
    const txt = fs.readFileSync(file, "utf8");
    const updated = txt.replace(
      /(require\(\s*['"])(@\/src\/v5\/)([^'"]+)(['"]\s*\))/g,
      (_m, p1, _v5, rest, p4) => `${p1}@/src/${rest}${p4}`
    ).replace(
      // Relative require to src/v5 -> try to map to alias (best-effort for CommonJS)
      /(require\(\s*['"])(\.[^'"]*?)(['"]\s*\))/g,
      (m, p1, rel, p3) => {
        try {
          const abs = path.resolve(path.dirname(file), rel);
          if (abs.includes(V5_SEGMENT)) {
            const newAbs = abs.replace(V5_SEGMENT, `${path.sep}src${path.sep}`);
            const alias = toAliasFromAbs(newAbs);
            if (alias) return `${p1}${alias}${p3}`;
          }
        } catch { /* ignore */ }
        return m;
      }
    );
    if (updated !== txt) fs.writeFileSync(file, updated, "utf8");
  }

  console.log(`Refactor complete. Files changed: ${changed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

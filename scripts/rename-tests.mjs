// rename-tests.mjs
import fs from "fs";
import path from "path";

const rootDir = path.resolve("src/tests");

function renameTestsRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      renameTestsRecursively(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      const newName = entry.name.replace(/\.test\.ts$/, ".spec.ts");
      const newPath = path.join(dir, newName);
      fs.renameSync(fullPath, newPath);
      console.log(`✅ Renamed: ${entry.name} → ${newName}`);
    }
  }
}

if (fs.existsSync(rootDir)) {
  renameTestsRecursively(rootDir);
  console.log("\nAll .test.ts files renamed to .spec.ts ✅");
} else {
  console.error(`❌ Directory not found: ${rootDir}`);
  process.exit(1);
}

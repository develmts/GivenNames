import { Project } from "ts-morph";
import path from "path";

const SRC_DIR = path.resolve(process.cwd(), "src/v5");

const project = new Project({
  tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
});

project.addSourceFilesAtPaths(`${SRC_DIR}/**/*.ts`);

const unused: Record<string, string[]> = {};

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();

  // Saltem test files
  if (filePath.includes(".test.ts")) continue;

  for (const func of sourceFile.getFunctions()) {
    const name = func.getName();
    if (!name) continue;

    const refs = func.findReferences();

    // Comptem totes les referències
    let refCount = 0;
    for (const ref of refs) {
      for (const refNode of ref.getReferences()) {
        const refFile = refNode.getSourceFile().getFilePath();
        // Ignorem la pròpia definició
        if (refFile === filePath && refNode.isDefinition()) continue;
        refCount++;
      }
    }

    if (refCount === 0) {
      if (!unused[filePath]) unused[filePath] = [];
      unused[filePath].push(name);
    }
  }

  // També podem incloure mètodes de classes
  for (const cls of sourceFile.getClasses()) {
    for (const method of cls.getMethods()) {
      const name = method.getName();
      const refs = method.findReferences();

      let refCount = 0;
      for (const ref of refs) {
        for (const refNode of ref.getReferences()) {
          const refFile = refNode.getSourceFile().getFilePath();
          if (refFile === filePath && refNode.isDefinition()) continue;
          refCount++;
        }
      }

      if (refCount === 0) {
        if (!unused[filePath]) unused[filePath] = [];
        unused[filePath].push(`${cls.getName()}.${name}`);
      }
    }
  }
}

console.log("=== Unused functions report (ts-morph) ===");
for (const [file, funcs] of Object.entries(unused)) {
  console.log(file);
  funcs.forEach(fn => console.log("  -", fn));
}

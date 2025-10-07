// src/tests/importer/importer.spec.ts
import fs from "fs"
import path from "path"
import os from "os"
import { vi, describe, test, beforeAll, beforeEach, afterAll, afterEach, expect } from "vitest"
import { ConfigManager } from "@/config.js"

// 👇 Definim un mock extern reutilitzable
const insertBatchMock = vi.fn(async (names: string[], meta: any) => names.length)

// 👇 Mock correcte del mòdul NameService (abans d’importar Importer)
vi.mock("@/services/NameService", () => {
  return {
    NameService: class {
      insertBatch = insertBatchMock
    },
  }
})

// 👇 Importació del mòdul després del mock
import { Importer } from "@/engines/importer/importer.js"

describe("Importer", () => {
  let tmpDir: string

  beforeAll(() => {
    ConfigManager.config(process.cwd())

    // Directori temporal amb un fitxer .txt vàlid
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-test-"))
    const fileContent = [
      "# locale=ca gender=f source=testSource",
      "# timestamp=2025-09-21T00:00:00Z",
      "Maria",
      "Anna",
      "Clara",
    ].join("\n")
    fs.writeFileSync(path.join(tmpDir, "names.txt"), fileContent)
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    insertBatchMock.mockClear()
  })

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
    const emptyDirs = fs
      .readdirSync(os.tmpdir())
      .filter((d) => d.startsWith("importer-empty-"))
      .map((d) => path.join(os.tmpdir(), d))
    for (const d of emptyDirs) {
      fs.rmSync(d, { recursive: true, force: true })
    }
  })

  test("should call insertBatch with parsed names and metadata", async () => {
    const cfg = ConfigManager.config()
    ;(cfg.paths as any).raw = tmpDir

    const importer = new Importer()
    await importer.run()

    expect(insertBatchMock).toHaveBeenCalledTimes(1)

    const [names, meta] = insertBatchMock.mock.calls[0]
    expect(names).toEqual(["Maria", "Anna", "Clara"])
    expect(meta).toMatchObject({
      locale: "ca",
      gender: "f",
      source: "testSource",
      timestamp: "2025-09-21T00:00:00Z",
    })
  })

  test("should warn if no .txt files found", async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-empty-"))
    ;(ConfigManager.config().paths as any).raw = emptyDir

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const importer = new Importer()
    await importer.run()

    expect(warnSpy).toHaveBeenCalledWith(
      "[importer] No .txt files found in",
      emptyDir
    )

    warnSpy.mockRestore()
  })

  test("should log dry-run mode when enabled", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-dryrun-"))
    ;(ConfigManager.config().paths as any).raw = tmpDir

    const filePath = path.join(tmpDir, "names.txt")
    fs.writeFileSync(filePath, "# locale=en gender=m source=test\nJohn\nPaul\n")

    const importer = new Importer()
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    await importer.run()

    const logOutput = spy.mock.calls.map((call) => call.join(" ")).join("\n")
    expect(logOutput).toMatch(/\(dry-run mode\)/)

    spy.mockRestore()
  })
})



// // src/tests/importer/importer.test.ts

// import fs from "fs";
// import path from "path";
// import os from "os";
// import { ConfigManager } from "@/config.js";
// import { Importer } from "@/engines/importer/importer.js";
// import { vi } from "vitest"

// // 👇 Definim un mock extern reutilitzable
// const insertBatchMock = vi.fn(async (names: string[], meta: any) => names.length);

// // 👇 Mock del mòdul tal com l’importa importer.ts
// vi.mock("./services/NameService", () => {
//   return {
//     NameService: class {
//       insertBatch = insertBatchMock;
//     },
//   };
// });


// describe("Importer", () => {
//   let tmpDir: string;

//   beforeAll(() => {
//     ConfigManager.config(process.cwd());

//     // Directori temporal amb un fitxer .txt vàlid
//     tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-test-"));
//     const fileContent = [
//       "# locale=ca gender=f source=testSource",
//       "# timestamp=2025-09-21T00:00:00Z",
//       "Maria",
//       "Anna",
//       "Clara",
//     ].join("\n");
//     fs.writeFileSync(path.join(tmpDir, "names.txt"), fileContent);
//   });

//   afterAll(() => {
//     fs.rmSync(tmpDir, { recursive: true, force: true });
//   });

//   beforeEach(() => {
//     insertBatchMock.mockClear();
//   });

//   afterEach(() => {
//     if (tmpDir && fs.existsSync(tmpDir)) {
//       fs.rmSync(tmpDir, { recursive: true, force: true });
//     }
//     const emptyDirs = fs.readdirSync(os.tmpdir())
//       .filter(d => d.startsWith("importer-empty-"))
//       .map(d => path.join(os.tmpdir(), d));
//     for (const d of emptyDirs) {
//       fs.rmSync(d, { recursive: true, force: true });
//     }
//   });

//   test("should call insertBatch with parsed names and metadata", async () => {
//     const cfg = ConfigManager.config();
//     (cfg.paths as any).raw = tmpDir;

//     const importer = new Importer();
//     await importer.run();

//     expect(insertBatchMock).toHaveBeenCalledTimes(1);

//     const [names, meta] = insertBatchMock.mock.calls[0];
//     expect(names).toEqual(["Maria", "Anna", "Clara"]);
//     expect(meta).toMatchObject({
//       locale: "ca",
//       gender: "f",
//       source: "testSource",
//       timestamp: "2025-09-21T00:00:00Z",
//     });
//   });

//   test("should warn if no .txt files found", async () => {
//     const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-empty-"));
//     (ConfigManager.config().paths as any).raw = emptyDir;

//     const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

//     const importer = new Importer();
//     await importer.run();

//     expect(warnSpy).toHaveBeenCalledWith(
//       "[importer] No .txt files found in",
//       emptyDir
//     );

//     warnSpy.mockRestore();
  
//   });

//   test("should log dry-run mode when enabled", async () => {
//     tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "importer-dryrun-"));
//     (ConfigManager.config().paths as any).raw = tmpDir;

//     // if (!fs.existsSync(tmpDir)) {
//     //   fs.mkdirSync(tmpDir, { recursive: true });
//     // }
//     const filePath = path.join(tmpDir, "names.txt");

//     fs.writeFileSync(
//       filePath,
//       "# locale=en gender=m source=test\nJohn\nPaul\n"
//     );

//     const importer = new Importer();
//     const spy = vi.spyOn(console, "log").mockImplementation(() => {});

//     await importer.run();

//     const logOutput = spy.mock.calls.map((call) => call.join(" ")).join("\n");
//     expect(logOutput).toMatch(/\(dry-run mode\)/);

//     spy.mockRestore();
//   });
// });

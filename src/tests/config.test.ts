// import {AppConfig } from "../v4/config";
// import { Appconfig } from  "../../config"    //"./v4/config";
import { ConfigManager } from "../config";


describe("ConfigManager", () => {
  test("should throw if called without rootPath on first call", () => {
    // reset state
    (ConfigManager as any).instance = undefined;
    expect(() => ConfigManager.config()).toThrow(/rootPath is required/);
  });

  test("should accept explicit rootPath on first call", () => {
    (ConfigManager as any).instance = undefined;
    const cfg = ConfigManager.config("/tmp/project-root");
    expect(cfg.rootPath).toBe("/tmp/project-root");
  });

  test("should return a config object with expected keys", () => {
    const cfg = ConfigManager.config()
    // console.log(cfg)

    expect(cfg).toHaveProperty("paths");
    expect(cfg).toHaveProperty("crawler");
    expect(cfg).toHaveProperty("importer");
    expect(cfg).toHaveProperty("verbose");
  });

  test("paths should contain required subkeys", () => {
    const cfg = ConfigManager.config()

    expect(cfg.paths).toHaveProperty("seeds");
    expect(cfg.paths).toHaveProperty("raw");
    expect(cfg.paths).toHaveProperty("sources");
    expect(cfg.paths).toHaveProperty("sql");
  });

  test("crawler should contain default options", () => {
    const cfg = ConfigManager.config();

    expect(cfg.crawler).toHaveProperty("defSeed");
    expect(cfg.crawler).toHaveProperty("maxPages");
    expect(cfg.crawler).toHaveProperty("headed");
  });
});


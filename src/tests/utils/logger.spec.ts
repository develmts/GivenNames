import { ConfigManager } from "@/config.js";
import Logger from "@/utils/logger.js";
import { vi } from "vitest"

describe("Logger", () => {
  beforeAll(() => {
    Logger.init(ConfigManager.config(process.cwd()));
  });

  test("should return a singleton instance", () => {
    const l1 = Logger.get();
    const l2 = Logger.get();
    expect(l1).toBe(l2);
  });

  test("should respect verbose flag", () => {
    const logger = Logger.get();
    logger.setVerbose(true);

    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("this is a debug log");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("should prefix messages automatically", () => {
    const logger = Logger.get();
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("Hello world");

    const args = spy.mock.calls[0];
    expect(args[0]).toMatch(/\[.*INFO\]/);
    expect(args[1]).toMatch("Hello world");
    spy.mockRestore();
  });

  test("should create a child logger with extra context", () => {
    const logger = Logger.get();
    const child = logger.child("TestModule");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    child.info("child log message");

    expect(spy).toHaveBeenCalled();

    const args = spy.mock.calls[0];
    expect(args[0]).toMatch(/TestModule/);
    expect(args[1]).toMatch("child log message");

    spy.mockRestore();
  });

  // 🔥 Afegits nous

  test("should log warnings with warn()", () => {
    const logger = Logger.get();
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warning message");
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0];
    expect(args[0]).toMatch(/\[.*WARN\]/);
    expect(args[1]).toBe("warning message");
    spy.mockRestore();
  });

  test("should log errors without stack when verbose=false", () => {
    const logger = Logger.get();
    logger.setVerbose(false);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("error message");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test("should log errors with stack when verbose=true", () => {
    const logger = Logger.get();
    logger.setVerbose(true);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("error with detail", new Error("boom"));
    // prefix + stack
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(spy.mock.calls[0][0]).toMatch(/\[.*ERROR\]/);
    spy.mockRestore();
  });

  test("should allow setVerbose() to enable debug later", () => {
    const logger = Logger.get();
    logger.setVerbose(true);
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("debug later");
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\[.*DEBUG\]/), "debug later");
    spy.mockRestore();
  });

test("child logger should support info, warn, error, debug", () => {
  const logger = Logger.get();
  logger.setVerbose(true);
  const child = logger.child("ChildTest");

  const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

  child.info("info msg");
  child.warn("warn msg");
  child.error("error msg", new Error("child boom"));
  child.debug("debug msg");

  expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/ChildTest/), "info msg");
  expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/ChildTest/), "warn msg");
  expect(errorSpy).toHaveBeenCalled();
  expect(debugSpy).toHaveBeenCalled();

  infoSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  debugSpy.mockRestore();
});
});

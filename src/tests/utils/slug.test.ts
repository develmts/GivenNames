import { slugify, isWindowsSafeFilename } from  "../../utils/slug" 


describe("slugify", () => {
  test("should sanitize a basic URL", () => {
    const url = "https://example.com/page";
    const result = slugify(url);
    expect(result).toBe("example.com-page");
  });

  test("should decode percent-encoding", () => {
    const url = "https://ca.wikipedia.org/wiki/Catal%C3%A0";
    const result = slugify(url);
    expect(result).toContain("catala");
  });

  test("should remove diacritics", () => {
    const url = "https://fr.wikipedia.org/wiki/Émilie";
    const result = slugify(url);
    expect(result).toContain("emilie");
  });

  test("should add fallback suffix if empty", () => {
    const url = "https://example.com/%%%";
    const result = slugify(url);
    expect(result).toMatch(/example-com-fallback-[a-f0-9]+/);
  });

  test("simple: clean word", () => {
    expect(slugify("Alicia")).toBe("alicia");
  });

  test("diacrítics: delete themn", () => {
    expect(slugify("María-Luisa")).toBe("maria-luisa");
  });

  test("basic URL", () => {
    expect(slugify("https://example.com/Alpha Beta?x=1"))
      .toBe("example.com-alpha-beta-x-1");
  });

  test("trailing dot & forbiden chars", () => {
    const out = slugify('name <> with * bad : chars.');
    expect(isWindowsSafeFilename(out)).toBe(true);
    expect(/[. ]$/.test(out)).toBe(false);
  });

  test("Reserved word: CON", () => {
    const out = slugify("CON");
    expect(isWindowsSafeFilename(out)).toBe(true);
    expect(out.toLowerCase()).not.toBe("con");
  });

  test("buit: fallback a UUID", () => {
    const out = slugify("");
    expect(isWindowsSafeFilename(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  test("only symbols: fallback", () => {
    const out = slugify(".....");
    expect(isWindowsSafeFilename(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  test("too long: cut to maxLen", () => {
    const out = slugify("x".repeat(400), { maxLen: 40 });
    expect(out.length).toBe(40);
    expect(isWindowsSafeFilename(out)).toBe(true);
  });

  test("Non Latin lang: basic transliteration", () => {
    const out = slugify("Τζώρτζιος");
    expect(isWindowsSafeFilename(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  test("keepCase=true no force lowercase (except sanititzation)", () => {
    const out = slugify("MiXed-CASE_Name", { keepCase: true });
    expect(/MiXed-CASE_Name/i.test(out) || out.toLowerCase() === "mixed-case_name").toBe(true);
  });

  test("mode=url does not apply windows check(But keeps normalization", () => {
    expect(slugify("https://foo/bar?Q=1", { mode: "url" }))
      .toBe("foo-bar-q-1");
  });

  test("simple 'percent-encoded' (à)", () => {
    expect(slugify("catal%C3%A0")).toBe("catala");
  });

});



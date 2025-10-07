import {
  NEGATIVE_WORDS,
  NOT_NAMES_UI,
  NOT_NAMES_LANGS,
  NOT_NAMES,
  isBlacklisted,
} from "@/engines/utils/not-names.js"
import { vi } from "vitest"

describe("not-names.ts", () => {
  test("lists should contain expected entries", () => {
    expect(NEGATIVE_WORDS).toContain("home")
    expect(NOT_NAMES_UI).toContain("Menu")
    expect(NOT_NAMES_LANGS).toContain("Català")

    // unified list has elements from all
    expect(NOT_NAMES).toEqual(
      expect.arrayContaining(["home", "Menu", "Català"])
    )
  })

  test("isBlacklisted detects UI words (case-insensitive)", () => {
    expect(isBlacklisted("Menu")).toBe(true)
    expect(isBlacklisted("menu")).toBe(true)
  })

  test("isBlacklisted detects languages", () => {
    expect(isBlacklisted("Català")).toBe(true)
    expect(isBlacklisted("català")).toBe(true)
  })

  test("isBlacklisted returns false for valid names", () => {
    expect(isBlacklisted("Maria")).toBe(false)
    expect(isBlacklisted("George")).toBe(false)
  })

  test("isBlacklisted verbose mode logs output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    const result = isBlacklisted("Menu", true)
    expect(result).toBe(true)
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[discard]"))

    spy.mockRestore()
  })
})

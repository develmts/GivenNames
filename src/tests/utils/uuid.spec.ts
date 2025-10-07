import { uuid, shortUUID } from "@/utils/uuid.js"

describe("uuid.ts", () => {
  describe("uuid()", () => {
    test("returns a non-empty string", () => {
      const id = uuid()
      expect(typeof id).toBe("string")
      expect(id.length).toBeGreaterThan(0)
    })

    test("matches UUID v4 format", () => {
      const id = uuid()
      const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      expect(id).toMatch(regex)
    })

    test("produces unique values", () => {
      const id1 = uuid()
      const id2 = uuid()
      expect(id1).not.toBe(id2)
    })
  })

  describe("shortUUID()", () => {
    test("returns a string without dashes", () => {
      const id = shortUUID()
      expect(id).not.toContain("-")
    })

    test("returns 10 characters by default", () => {
      const id = shortUUID()
      expect(id.length).toBe(10)
    })

    test("returns custom length when specified", () => {
      const id = shortUUID(16)
      expect(id.length).toBe(16)
    })

    test("produces unique values", () => {
      const id1 = shortUUID()
      const id2 = shortUUID()
      expect(id1).not.toBe(id2)
    })
  })
})

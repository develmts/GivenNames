import { JSDOM } from "jsdom"
import { isValidName, extractValidNames, extractPotentialNamesFromHTML } from "@/engines/utils/nameExtractor"


describe("nameExtractor.ts", () => {
  describe("isValidName", () => {
    test("rejects empty string", () => {
      const res = isValidName("")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("empty")
    })

    test("rejects too short or too long", () => {
      expect(isValidName("A").valid).toBe(false)
      expect(isValidName("A".repeat(60)).valid).toBe(false)
    })

    test("rejects too many words", () => {
      const res = isValidName("One Two Three Four")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("too many words")
    })

    test("rejects if not starting with capital letter", () => {
      const res = isValidName("maria")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("does not start with capital letter")
    })

    test("rejects if multiple capitalized words", () => {
      const res = isValidName("Maria Luisa")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("multiple capitalized words")
    })

    test("rejects blacklisted words", () => {
      const res = isValidName("Menu")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("blacklisted (UI/lang)")
    })

    test("accepts a valid name", () => {
      const res = isValidName("Maria")
      expect(res.valid).toBe(true)
    })

    test("rejects invalid characters", () => {
      const res = isValidName("M@ria")
      expect(res.valid).toBe(false)
      expect(res.reasons).toContain("invalid characters or pattern")
    })
  })

  describe("extractValidNames", () => {
    test("filters only valid names", () => {
      const candidates = ["Maria", "menu", "George", "TooMany Words Here"]
      const result = extractValidNames(candidates)
      expect(result).toContain("Maria")
      expect(result).toContain("George")
      expect(result).not.toContain("menu")
      expect(result).not.toContain("TooMany Words Here")
    })
  })

  describe("extractPotentialNamesFromHTML", () => {
    test("extracts valid names from allowed tags", () => {
      const dom = new JSDOM(`
        <html>
          <body>
            <h1>Maria</h1>
            <div>George</div>
            <script>NotAName</script>
            <ul><li><a>Paul</a></li></ul>
          </body>
        </html>
      `)
      const document = dom.window.document
      const names = extractPotentialNamesFromHTML(document)
      expect(names).toEqual(expect.arrayContaining(["Maria", "George", "Paul"]))
      expect(names).not.toContain("NotAName")
    })

    test("avoids duplicates", () => {
      const dom = new JSDOM(`<div>Maria</div><p>Maria</p>`)
      const document = dom.window.document
      const names = extractPotentialNamesFromHTML(document)
      expect(names.filter(n => n === "Maria").length).toBe(1)
    })
  })
})

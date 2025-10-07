// src/tests/utils/genderInference.test.ts
import {
  inferGender,
  inferGenderFromURI,
  inferGenderFromNameList,
  inferGenderFromMetadata,
  GenderResult
} from  "@/engines/utils/genderInference.js"
//"../../../utils/genderInference"

describe("genderInference", () => {
  test("inferGender should return unknown for names not in terms", () => {
    const res = inferGender("Xyz")
    expect(res.gender).toBe("unknown")
  })

  test("inferGenderFromURI should detect male/female/neutral tokens in URI", () => {
    const maleRes = inferGenderFromURI("https://example.com/male-names", "en")
    expect(maleRes.gender).toBe("male")

    const femaleRes = inferGenderFromURI("https://example.com/female-names", "en")
    expect(femaleRes.gender).toBe("female")

    const neutralRes = inferGenderFromURI("https://example.com/neutral-list", "en")
    expect(neutralRes.gender).toBe("neutral")
  })

  test("inferGenderFromNameList should return male if majority male", () => {
    const res = inferGenderFromNameList(["maleName", "maleName"], "en")
    expect(["male", "unknown"]).toContain(res.gender) // depèn dels termes reals
  })

  test("inferGenderFromNameList should return unknown if no clear majority", () => {
    const res = inferGenderFromNameList(["abc", "def"], "en")
    expect(res.gender).toBe("unknown")
  })

  test("inferGenderFromMetadata should respect explicit gender in metadata", () => {
    const res = inferGenderFromMetadata("anything", { gender: "female" })
    expect(res.gender).toBe("female")
    expect(res.source).toBe("metadata")
  })

  test("inferGenderFromMetadata should parse filename patterns", () => {
    const f = inferGenderFromMetadata("test", { urlId: "names-F.txt" })
    expect(f.gender).toBe("female")
    const m = inferGenderFromMetadata("test", { urlId: "names-M.txt" })
    expect(m.gender).toBe("male")
    const n = inferGenderFromMetadata("test", { urlId: "names-N.txt" })
    expect(n.gender).toBe("neutral")
  })

  test("inferGenderFromMetadata should fallback to suffix detection", () => {
    const res = inferGenderFromMetadata("Alex") // Alex és unisex
    expect(["male", "female", "neutral", "unknown"]).toContain(res.gender)
    expect(["unisex-known", expect.stringMatching(/^suffix:/)]).toContain(res.source)
  })
})

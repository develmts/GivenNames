// src/tests/utils/passwords.test.ts
import { hashPassword, verifyPassword } from "@/services/ApiService/utils/pwdUtils.js"

const SKIP_DB_TESTS = false // killswitch per consistència, aquí no cal DB

describe("password utils", () => {
  if (SKIP_DB_TESTS) return

  test("should hash a password and verify it successfully", async () => {
    const plain = "mySecret123"
    const hashed = await hashPassword(plain)

    expect(typeof hashed).toBe("string")
    expect(hashed.length).toBeGreaterThan(20)

    const valid = await verifyPassword(plain, hashed)
    expect(valid).toBe(true)
  })

  test("should fail verification with wrong password", async () => {
    const plain = "correctPassword"
    const hashed = await hashPassword(plain)

    const valid = await verifyPassword("wrongPassword", hashed)
    expect(valid).toBe(false)
  })

  test("should produce different hashes for same input (salted)", async () => {
    const plain = "repeatable"
    const hash1 = await hashPassword(plain)
    const hash2 = await hashPassword(plain)

    expect(hash1).not.toEqual(hash2)
  })
})

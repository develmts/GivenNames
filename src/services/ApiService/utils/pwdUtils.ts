import { hash, verify } from "argon2"

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain)
}

export async function verifyPassword(
  plain: string,
  hashValue: string
): Promise<boolean> {
  return verify(hashValue, plain)
}

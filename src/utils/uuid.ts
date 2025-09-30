// src/v4/utils/uuid.ts
import { randomBytes, randomUUID as nodeRandomUUID } from "crypto";

/** RFC 4122 v4 UUID — usa crypto.randomUUID si hi és, sinó el genera manualment. */
export function uuid(): string {
  if (typeof nodeRandomUUID === "function") return nodeRandomUUID();

  // Fallback manual (v4) si randomUUID no està disponible
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const hex = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/** ID curt derivat del UUID sense guions (per sufixos de fitxer, etc.) */
export function shortUUID(len = 10): string {
  return uuid().replace(/-/g, "").slice(0, len);
}

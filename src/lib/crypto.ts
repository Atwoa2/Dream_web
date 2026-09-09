/**
 * Cryptographic primitives. Node's crypto only — no third-party dependencies.
 */
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * One-time sign-in code. crypto.randomInt is cryptographically strong;
 * Math.random is predictable and must never be used here.
 */
export function generateOtpCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i += 1) code += randomInt(0, 10).toString();
  return code;
}

/** URL-safe random token (sessions, OAuth state). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Constant-time comparison of two hex digests. A plain === leaks how many
 * leading characters matched through response timing.
 */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

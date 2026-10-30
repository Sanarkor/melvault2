import { b64 } from "@/lib/vault/crypto";
import { normalizeRecoveryCode } from "@/lib/vault/recovery";

const encoder = new TextEncoder();

/** Iterations for new vaults. Existing coffres keep the count stored with them. */
export const KDF_ITERATIONS_V2 = 600_000;

/** What the login server stores. Not the key that opens the coffre. */
export async function authSecret(email: string, password: string): Promise<string> {
  const salt = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(`melvault-auth-v2:${email.trim().toLowerCase()}`)),
  );
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: KDF_ITERATIONS_V2, hash: "SHA-256" },
    material,
    256,
  );
  return b64(new Uint8Array(bits));
}

/** One-way proof of the recovery code. It cannot unwrap the coffre. */
export async function recoveryVerifier(code: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`melvault-recovery-v2:${normalizeRecoveryCode(code)}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

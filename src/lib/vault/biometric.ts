import { b64, decryptBytes, encryptBytes, randomBytes, unb64 } from "@/lib/vault/crypto";
import type { CipherPack } from "@/lib/vault/types";

const BIO_KEY = "coffre.biometric";

export type BiometricLogin = {
  email: string;
  credentialId: string;
  prfSalt?: string;
  authWrap?: CipherPack;
  dekWrap?: CipherPack;
};

export function biometricAvailable(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && typeof window.PublicKeyCredential !== "undefined";
}

export function readBiometricLogin(): BiometricLogin | null {
  try {
    const raw = localStorage.getItem(BIO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BiometricLogin> & { password?: unknown };
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    if (!email || typeof parsed.credentialId !== "string" || parsed.credentialId.length < 8) return null;
    const next: BiometricLogin = { email, credentialId: parsed.credentialId };
    if (typeof parsed.prfSalt === "string") next.prfSalt = parsed.prfSalt;
    if (isPack(parsed.authWrap)) next.authWrap = parsed.authWrap;
    if (isPack(parsed.dekWrap)) next.dekWrap = parsed.dekWrap;
    if ("password" in parsed) localStorage.setItem(BIO_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function writeBiometricLogin(record: BiometricLogin): void {
  const email = record.email.trim().toLowerCase();
  if (!email || !record.credentialId) return;
  localStorage.setItem(BIO_KEY, JSON.stringify({ ...record, email }));
}

export function clearBiometricLogin(): void {
  localStorage.removeItem(BIO_KEY);
}

function isPack(value: unknown): value is CipherPack {
  if (!value || typeof value !== "object") return false;
  const pack = value as Partial<CipherPack>;
  return typeof pack.iv === "string" && typeof pack.ct === "string";
}

function bufferOf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToB64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bufferOf(bytes);
}

function prfBytes(credential: Credential, salt: Uint8Array): Uint8Array | null {
  if (!("getClientExtensionResults" in credential)) return null;
  const results = (credential as PublicKeyCredential).getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer } };
  };
  const first = results.prf?.results?.first;
  if (!first || first.byteLength < 32) return null;
  void salt;
  return new Uint8Array(first.slice(0, 32));
}

async function prfKey(secret: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", secret as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealWithPrf(secret: Uint8Array, bytes: Uint8Array): Promise<CipherPack> {
  return encryptBytes(await prfKey(secret), bytes);
}

export async function openWithPrf(secret: Uint8Array, pack: CipherPack): Promise<Uint8Array> {
  return decryptBytes(await prfKey(secret), pack);
}

export async function registerBiometric(email: string): Promise<{ credentialId: string; prfSalt: string; prf: Uint8Array | null }> {
  if (!biometricAvailable()) throw new Error("Empreinte ou visage indisponible sur cet appareil.");
  const prfSaltBytes = randomBytes(32);
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: bufferOf(crypto.getRandomValues(new Uint8Array(32))),
      rp: { name: "Mel Vault" },
      user: {
        id: bufferOf(crypto.getRandomValues(new Uint8Array(16))),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none",
      extensions: { prf: { eval: { first: bufferOf(prfSaltBytes) } } } as AuthenticationExtensionsClientInputs,
    },
  });
  if (!credential || credential.type !== "public-key") throw new Error("Empreinte ou visage refusé.");
  return {
    credentialId: bytesToB64url(new Uint8Array((credential as PublicKeyCredential).rawId)),
    prfSalt: b64(prfSaltBytes),
    prf: prfBytes(credential, prfSaltBytes),
  };
}

export async function verifyBiometric(credentialId: string, prfSalt?: string | null): Promise<Uint8Array | null> {
  if (!biometricAvailable()) throw new Error("Empreinte ou visage indisponible sur cet appareil.");
  const salt = prfSalt ? unb64(prfSalt) : randomBytes(32);
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: bufferOf(crypto.getRandomValues(new Uint8Array(32))),
      userVerification: "required",
      allowCredentials: [{ type: "public-key", id: b64urlToBuffer(credentialId) }],
      timeout: 60_000,
      extensions: { prf: { eval: { first: bufferOf(salt) } } } as AuthenticationExtensionsClientInputs,
    },
  });
  if (!credential) throw new Error("Vérification annulée.");
  return prfBytes(credential, salt);
}

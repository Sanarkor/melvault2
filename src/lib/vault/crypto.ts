import { normalizeAccount, type AccountFields, type CipherPack } from "@/lib/vault/types";

export const KDF_ITERATIONS = 210_000;
const EXPORT_ITERATIONS = 600_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function b64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function unb64(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 === 1) {
    throw new Error("Donnée chiffrée invalide");
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveAesKey(
  secret: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, [
    "deriveKey",
  ]);
  const saltCopy = new Uint8Array(salt);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltCopy as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

export async function encryptBytes(key: CryptoKey, data: Uint8Array): Promise<CipherPack> {
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new Uint8Array(data) as BufferSource,
  );
  return { iv: b64(iv), ct: b64(new Uint8Array(cipher)) };
}

export async function decryptBytes(key: CryptoKey, pack: CipherPack): Promise<Uint8Array> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(pack.iv) as BufferSource },
    key,
    unb64(pack.ct) as BufferSource,
  );
  return new Uint8Array(plain);
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<CipherPack> {
  return encryptBytes(key, encoder.encode(JSON.stringify(value)));
}

export async function decryptJson<T>(key: CryptoKey, pack: CipherPack): Promise<T> {
  const bytes = await decryptBytes(key, pack);
  return JSON.parse(decoder.decode(bytes)) as T;
}

export async function createDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function wrapDek(dek: CryptoKey, kek: CryptoKey): Promise<CipherPack> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", dek));
  return encryptBytes(kek, raw);
}

export async function unwrapDek(pack: CipherPack, kek: CryptoKey): Promise<CryptoKey> {
  const raw = await decryptBytes(kek, pack);
  return crypto.subtle.importKey("raw", new Uint8Array(raw) as BufferSource, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export function parsePack(value: string): CipherPack {
  const parsed = JSON.parse(value) as Partial<CipherPack>;
  if (!parsed || typeof parsed.iv !== "string" || typeof parsed.ct !== "string") {
    throw new Error("Coffre illisible");
  }
  return { iv: parsed.iv, ct: parsed.ct };
}

export async function sealAccount(
  dek: CryptoKey,
  account: AccountFields,
): Promise<{ id: string; iv: string; ciphertext: string }> {
  const pack = await encryptJson(dek, account);
  return { id: crypto.randomUUID(), iv: pack.iv, ciphertext: pack.ct };
}

export async function openAccount(
  dek: CryptoKey,
  iv: string,
  ciphertext: string,
): Promise<AccountFields> {
  const value = await decryptJson<unknown>(dek, { iv, ct: ciphertext });
  const account = normalizeAccount(value);
  if (!account) throw new Error("Entrée illisible");
  return account;
}

export async function buildExportFile(
  accounts: AccountFields[],
  passphrase: string,
): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveAesKey(passphrase, salt, EXPORT_ITERATIONS, ["encrypt"]);
  const pack = await encryptJson(key, { accounts });
  return JSON.stringify({
    format: "coffre-personnel",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: EXPORT_ITERATIONS,
    salt: b64(salt),
    iv: pack.iv,
    ct: pack.ct,
  });
}

export async function readExportFile(
  fileText: string,
  passphrase: string,
): Promise<AccountFields[]> {
  if (fileText.length > 2_000_000) throw new Error("Fichier trop volumineux.");
  let parsed: {
    format?: string;
    version?: number;
    iterations?: number;
    salt?: string;
    iv?: string;
    ct?: string;
  };
  try {
    parsed = JSON.parse(fileText) as typeof parsed;
  } catch {
    throw new Error("Fichier illisible.");
  }
  if (parsed.format !== "coffre-personnel" || parsed.version !== 1) {
    throw new Error("Ce fichier n'est pas un coffre chiffré.");
  }
  const iterations = Number(parsed.iterations);
  if (!Number.isFinite(iterations) || iterations < 10_000 || iterations > 1_000_000) {
    throw new Error("Fichier invalide.");
  }
  if (typeof parsed.salt !== "string" || typeof parsed.iv !== "string" || typeof parsed.ct !== "string") {
    throw new Error("Fichier invalide.");
  }
  try {
    const key = await deriveAesKey(passphrase, unb64(parsed.salt), iterations, ["decrypt"]);
    const data = await decryptJson<{ accounts?: unknown }>(key, { iv: parsed.iv, ct: parsed.ct });
    if (!Array.isArray(data.accounts)) throw new Error("Fichier invalide.");
    return data.accounts
      .map((entry) => normalizeAccount(entry))
      .filter((entry): entry is AccountFields => entry !== null);
  } catch (error) {
    if (error instanceof Error && /fichier|coffre|invalide|illisible/i.test(error.message)) throw error;
    throw new Error("Phrase secrète incorrecte ou fichier endommagé.");
  }
}

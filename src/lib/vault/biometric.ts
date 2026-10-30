const BIO_KEY = "coffre.biometric";

export type BiometricLogin = { email: string; password: string; credentialId: string };

export function biometricAvailable(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && typeof window.PublicKeyCredential !== "undefined";
}

export function readBiometricLogin(): BiometricLogin | null {
  try {
    const raw = localStorage.getItem(BIO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BiometricLogin>;
    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    if (!email || typeof parsed.password !== "string" || !parsed.password) return null;
    if (typeof parsed.credentialId !== "string" || parsed.credentialId.length < 8) return null;
    return { email, password: parsed.password, credentialId: parsed.credentialId };
  } catch {
    return null;
  }
}

export function writeBiometricLogin(email: string, password: string, credentialId: string): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || !credentialId) return;
  localStorage.setItem(BIO_KEY, JSON.stringify({ email: normalized, password, credentialId }));
}

export function clearBiometricLogin(): void {
  localStorage.removeItem(BIO_KEY);
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

export async function registerBiometric(email: string): Promise<string> {
  if (!biometricAvailable()) throw new Error("Empreinte ou visage indisponible sur cet appareil.");
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
    },
  });
  if (!credential || credential.type !== "public-key") throw new Error("Empreinte ou visage refusé.");
  return bytesToB64url(new Uint8Array((credential as PublicKeyCredential).rawId));
}

export async function verifyBiometric(credentialId: string): Promise<void> {
  if (!biometricAvailable()) throw new Error("Empreinte ou visage indisponible sur cet appareil.");
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: bufferOf(crypto.getRandomValues(new Uint8Array(32))),
      userVerification: "required",
      allowCredentials: [{ type: "public-key", id: b64urlToBuffer(credentialId) }],
      timeout: 60_000,
    },
  });
  if (!credential) throw new Error("Vérification annulée.");
}

import { b64, unb64 } from "@/lib/vault/crypto";

export type DocType = "cni" | "passport" | "other";

export type VaultDocument = {
  kind: "document";
  docType: DocType;
  title: string;
  image: string;
};

export type StoredDocument = VaultDocument & { id: string };

const DOC_TYPES = new Set<DocType>(["cni", "passport", "other"]);

export function isVaultDocument(value: unknown): value is VaultDocument {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.kind === "document" &&
    typeof row.docType === "string" &&
    DOC_TYPES.has(row.docType as DocType) &&
    typeof row.title === "string" &&
    typeof row.image === "string" &&
    row.image.length > 32 &&
    row.image.length < 500_000
  );
}

export function compressDocumentImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Image illisible."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.72;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > 420_000 && quality > 0.42) {
        quality -= 0.08;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      const payload = data.slice(data.indexOf(",") + 1);
      if (payload.length > 480_000) {
        reject(new Error("Photo trop lourde."));
        return;
      }
      resolve(payload);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    img.src = url;
  });
}

const PIN_PREFIX = "coffre.docpin.";

async function pinDigest(pin: string, salt: Uint8Array): Promise<string> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new Uint8Array(salt) as BufferSource, iterations: 120_000, hash: "SHA-256" },
    material,
    256,
  );
  return b64(new Uint8Array(bits));
}

export function hasDocumentPin(userId: string): boolean {
  try {
    return Boolean(localStorage.getItem(PIN_PREFIX + userId));
  } catch {
    return false;
  }
}

export async function saveDocumentPin(userId: string, pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pinDigest(pin, salt);
  localStorage.setItem(PIN_PREFIX + userId, JSON.stringify({ salt: b64(salt), hash }));
}

export function clearDocumentPin(userId: string): void {
  localStorage.removeItem(PIN_PREFIX + userId);
}

export async function checkDocumentPin(userId: string, pin: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(PIN_PREFIX + userId);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { salt?: unknown; hash?: unknown };
    if (typeof parsed.salt !== "string" || typeof parsed.hash !== "string") return false;
    const hash = await pinDigest(pin, unb64(parsed.salt));
    return hash === parsed.hash;
  } catch {
    return false;
  }
}

import { b64, unb64 } from "@/lib/vault/crypto";

export type DocType = "cni" | "passport" | "other";

export type VaultDocument = {
  kind: "document";
  docType: DocType;
  title: string;
  image: string;
  mime?: string;
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
    row.image.length < 2_900_000 &&
    (row.mime === undefined || (typeof row.mime === "string" && row.mime.length < 120))
  );
}

const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  svg: "image/svg+xml",
};

export const DOCUMENT_ACCEPT = [
  "image/*",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".csv",
  ".txt",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
  ".svg",
].join(",");

function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function documentMime(file: File): string | null {
  const fromName = FILE_TYPES[extensionOf(file.name)];
  const fromType = file.type.toLowerCase();
  if (fromType.startsWith("image/")) return fromType;
  if (fromName) return fromName;
  if (fromType && FILE_TYPES[extensionOf(`x.${fromType.split("/").pop()}`)]) return fromType;
  if (
    fromType === "application/pdf" ||
    fromType.includes("word") ||
    fromType.includes("excel") ||
    fromType.includes("spreadsheet") ||
    fromType.includes("presentation")
  ) {
    return fromType;
  }
  return null;
}

export const MAX_DOCUMENTS = 10;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("Fichier trop lourd (2 Mo maximum)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const payload = result.slice(result.indexOf(",") + 1);
      if (!payload || payload.length < 32) {
        reject(new Error("Fichier vide."));
        return;
      }
      if (payload.length > 2_800_000) {
        reject(new Error("Fichier trop lourd (2 Mo maximum)."));
        return;
      }
      resolve(payload);
    };
    reader.onerror = () => reject(new Error("Fichier illisible."));
    reader.readAsDataURL(file);
  });
}

export async function prepareDocumentFile(file: File): Promise<{ image: string; mime: string }> {
  const mime = documentMime(file);
  if (!mime) throw new Error("Format non accepté.");
  if (mime.startsWith("image/") && mime !== "image/svg+xml" && mime !== "image/heic" && mime !== "image/heif") {
    try {
      return { image: await compressDocumentImage(file), mime: "image/jpeg" };
    } catch {
      /* photo illisible par le navigateur : on garde le fichier d'origine s'il est assez léger */
    }
  }
  return { image: await fileToBase64(file), mime };
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

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Strip spaces and dashes. The stored verifier uses this form. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z2-9]/g, "");
}

function randomIndex(size: number): number {
  if (size <= 0 || size > 256) throw new Error("Taille invalide");
  const max = Math.floor(256 / size) * size;
  const buf = new Uint8Array(1);
  let value = 256;
  while (value >= max) {
    crypto.getRandomValues(buf);
    value = buf[0] ?? 256;
  }
  return value % size;
}

/** 24 symbols, grouped for reading. About 120 bits. */
export function generateRecoveryCode(): string {
  let raw = "";
  for (let i = 0; i < 24; i += 1) {
    raw += RECOVERY_ALPHABET[randomIndex(RECOVERY_ALPHABET.length)];
  }
  return raw.replace(/(.{4})(?!$)/g, "$1-");
}

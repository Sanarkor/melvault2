const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+?",
} as const;

export type PasswordOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
};

export type Strength = { score: 0 | 1 | 2 | 3; label: string };

function randomIndex(size: number): number {
  const max = Math.floor(256 / size) * size;
  const buf = new Uint8Array(1);
  let value = 256;
  while (value >= max) {
    crypto.getRandomValues(buf);
    value = buf[0] ?? 256;
  }
  return value % size;
}

export function generatePassword(options: PasswordOptions): string {
  const pools: string[] = [];
  if (options.upper) pools.push(SETS.upper);
  if (options.lower) pools.push(SETS.lower);
  if (options.digits) pools.push(SETS.digits);
  if (options.symbols) pools.push(SETS.symbols);
  if (pools.length === 0) throw new Error("Choisissez au moins un type de caractère.");
  const all = pools.join("");
  const length = Math.min(48, Math.max(12, Math.round(options.length)));
  const chars: string[] = pools.map((pool) => pool[randomIndex(pool.length)] ?? "");
  while (chars.length < length) chars.push(all[randomIndex(all.length)] ?? "");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    const swap = chars[i] ?? "";
    chars[i] = chars[j] ?? "";
    chars[j] = swap;
  }
  return chars.join("");
}

export function strengthOf(password: string): Strength {
  if (!password) return { score: 0, label: "Vide" };
  let size = 0;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[a-z]/.test(password)) size += 26;
  if (/\d/.test(password)) size += 10;
  if (/[^A-Za-z0-9]/.test(password)) size += 22;
  const entropy = password.length * Math.log2(Math.max(size, 2));
  if (entropy < 45) return { score: 0, label: "Faible" };
  if (entropy < 65) return { score: 1, label: "Moyen" };
  if (entropy < 85) return { score: 2, label: "Fort" };
  return { score: 3, label: "Très fort" };
}

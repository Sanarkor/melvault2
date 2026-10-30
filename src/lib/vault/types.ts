export const CATEGORY_IDS = [
  "mail",
  "telephony",
  "internet",
  "official",
  "school",
  "entertainment",
  "games",
  "delivery",
  "shopping",
  "health",
  "travel",
] as const;

export type CategoryId = string;

export type AccountFields = {
  service: string;
  category: CategoryId;
  username: string;
  email: string;
  password: string;
  phone: string;
  notes: string;
};

export type VaultItem = AccountFields & { id: string };

export type CipherPack = { iv: string; ct: string };

export function isCategoryId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

const LEGACY_CATEGORIES: Record<string, CategoryId> = {
  emails: "mail",
  social: "internet",
  entertainment: "entertainment",
  shopping: "shopping",
  work: "internet",
  home: "internet",
  travel: "travel",
  tech: "internet",
  studies: "school",
  other: "internet",
};

function categoryOf(value: unknown): string {
  if (typeof value === "string" && value in LEGACY_CATEGORIES) return LEGACY_CATEGORIES[value];
  if (isCategoryId(value)) return value;
  return "internet";
}

export function normalizeAccount(input: unknown): AccountFields | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const service = typeof row.service === "string" ? row.service.trim().slice(0, 120) : "";
  if (!service) return null;
  const text = (key: string, max: number) =>
    typeof row[key] === "string" ? row[key].slice(0, max) : "";
  return {
    service,
    category: categoryOf(row.category),
    username: text("username", 200),
    email: text("email", 200),
    password: text("password", 256),
    phone: text("phone", 40),
    notes: text("notes", 2000),
  };
}

export function compteLabel(count: number): string {
  return count === 1 ? "1 compte" : `${count} comptes`;
}

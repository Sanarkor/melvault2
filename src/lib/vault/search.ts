import type { AccountFields } from "@/lib/vault/types";

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function matchesQuery(
  item: AccountFields,
  query: string,
  labels: { id: string; label: string }[] = [],
): boolean {
  const needle = fold(query.trim());
  if (!needle) return true;
  const category = labels.find((entry) => entry.id === item.category)?.label ?? "";
  const haystack = [item.service, item.username, item.email, category, item.notes].map(fold).join("\n");
  return haystack.includes(needle);
}

export function countByCategory(items: AccountFields[], ids: string[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const item of items) {
    if (item.category in counts) counts[item.category] += 1;
  }
  return counts;
}

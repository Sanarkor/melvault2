import {
  Briefcase,
  Clapperboard,
  Gamepad2,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Mail,
  ShoppingBag,
  Smartphone,
  Tag,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

export type VaultCategory = { id: string; label: string; icon: LucideIcon };

export type CategoryCatalog = {
  removed: string[];
  added: { id: string; label: string }[];
};

export const BUILTIN: VaultCategory[] = [
  { id: "mail", label: "Mail", icon: Mail },
  { id: "telephony", label: "Téléphonie", icon: Smartphone },
  { id: "internet", label: "Internet", icon: Globe },
  { id: "official", label: "Démarches officielles", icon: Landmark },
  { id: "school", label: "Scolaire", icon: GraduationCap },
  { id: "entertainment", label: "Divertissement", icon: Clapperboard },
  { id: "games", label: "Jeux vidéo", icon: Gamepad2 },
  { id: "delivery", label: "Travail", icon: Briefcase },
  { id: "shopping", label: "Achat/Magasin", icon: ShoppingBag },
  { id: "health", label: "Santé", icon: HeartPulse },
  { id: "travel", label: "Transport", icon: TrainFront },
];

const ICONS = new Map(BUILTIN.map((entry) => [entry.id, entry.icon]));

export function categoryIcon(id: string): LucideIcon {
  return ICONS.get(id) ?? Tag;
}

export function slugifyCategory(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function resolveCategories(catalog: CategoryCatalog, usedIds: string[] = []): VaultCategory[] {
  const removed = new Set(catalog.removed);
  const list: VaultCategory[] = BUILTIN.filter((entry) => !removed.has(entry.id));
  const known = new Set(list.map((entry) => entry.id));
  for (const entry of catalog.added) {
    if (removed.has(entry.id) || known.has(entry.id)) continue;
    known.add(entry.id);
    list.push({ id: entry.id, label: entry.label, icon: Tag });
  }
  for (const id of usedIds) {
    if (!id || known.has(id) || removed.has(id)) continue;
    known.add(id);
    list.push({ id, label: id, icon: Tag });
  }
  return list;
}

export function categoryLabel(id: string, categories: { id: string; label: string }[] = BUILTIN): string {
  return categories.find((entry) => entry.id === id)?.label ?? "Internet";
}

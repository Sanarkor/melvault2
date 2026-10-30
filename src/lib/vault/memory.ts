type Listener = () => void;

let dek: CryptoKey | null = null;
let version = 0;
const listeners = new Set<Listener>();

export function getDek(): CryptoKey | null {
  return dek;
}

export function getUnlockVersion(): number {
  return version;
}

export function subscribeUnlock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDek(next: CryptoKey | null): void {
  dek = next;
  version += 1;
  listeners.forEach((listener) => listener());
}

const BEARER_KEY = "grok-auth.bearer-token";

export function rememberBearer(token: string | null | undefined): void {
  if (typeof window === "undefined" || !token) return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function demoStorageKey(userId: string): string {
  return `coffre.demo.${userId}`;
}

export function readDemoIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(demoStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeDemoIds(userId: string, ids: string[]): void {
  localStorage.setItem(demoStorageKey(userId), JSON.stringify(ids));
}

export function clearDemoIds(userId: string): void {
  localStorage.removeItem(demoStorageKey(userId));
}

const LOCK_KEY = "coffre.lockMinutes";

export function readLockMinutes(): number {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const value = raw ? Number(raw) : 5;
    return [1, 5, 15, 30].includes(value) ? value : 5;
  } catch {
    return 5;
  }
}

export function writeLockMinutes(minutes: number): void {
  localStorage.setItem(LOCK_KEY, String(minutes));
}

const REMEMBER_KEY = "coffre.rememberLogin";

export function readRememberedLogin(): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown; password?: unknown };
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") return null;
    const email = parsed.email.trim().toLowerCase();
    if (!email || !parsed.password) return null;
    return { email, password: parsed.password };
  } catch {
    return null;
  }
}

export function writeRememberedLogin(email: string, password: string): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return;
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: normalized, password }));
}

export function clearRememberedLogin(): void {
  localStorage.removeItem(REMEMBER_KEY);
}

const CATALOG_PREFIX = "coffre.categories.";

export function readCategoryCatalog(userId: string): { removed: string[]; added: { id: string; label: string }[] } {
  try {
    const raw = localStorage.getItem(CATALOG_PREFIX + userId);
    if (!raw) return { removed: [], added: [] };
    const parsed = JSON.parse(raw) as { removed?: unknown; added?: unknown };
    const removed = Array.isArray(parsed.removed)
      ? parsed.removed.filter((id): id is string => typeof id === "string")
      : [];
    const added = Array.isArray(parsed.added)
      ? parsed.added.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const row = entry as { id?: unknown; label?: unknown };
          if (typeof row.id !== "string" || typeof row.label !== "string") return [];
          return [{ id: row.id, label: row.label }];
        })
      : [];
    return { removed, added };
  } catch {
    return { removed: [], added: [] };
  }
}

export function writeCategoryCatalog(
  userId: string,
  catalog: { removed: string[]; added: { id: string; label: string }[] },
): void {
  localStorage.setItem(CATALOG_PREFIX + userId, JSON.stringify(catalog));
}

export function rotateRememberedPassword(currentPassword: string, nextPassword: string): void {
  const saved = readRememberedLogin();
  if (!saved || saved.password !== currentPassword || !nextPassword) return;
  writeRememberedLogin(saved.email, nextPassword);
}

import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { KDF_ITERATIONS } from "@/lib/vault/crypto";
import { normalizeRecoveryCode } from "@/lib/vault/recovery";

type MetaRow = {
  kdf_iters: number;
  kdf_salt: string;
  dek_password: string;
  recovery_iters: number;
  recovery_salt: string;
  dek_recovery: string;
  recovery_hint: string;
};

export type VaultMeta = {
  kdfIters: number;
  kdfSalt: string;
  dekPassword: string;
  recoveryIters: number;
  recoverySalt: string;
  dekRecovery: string;
  recoveryHint: string;
};

export type StoredItem = { id: string; iv: string; ciphertext: string; hasPassword?: boolean };

const FAIL_MESSAGE = "Code de récupération incorrect, ou aucun coffre pour cette adresse.";

type Bucket = { fails: number; until: number };
const rlHost = globalThis as typeof globalThis & { __coffreRecoveryRl?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  rlHost.__coffreRecoveryRl ??= new Map();
  return rlHost.__coffreRecoveryRl;
}

function assertRecoveryAllowed(email: string): void {
  const bucket = buckets().get(email);
  if (bucket && bucket.until > Date.now() && bucket.fails >= 8) {
    throw new Error("Trop de tentatives. Réessayez dans quelques minutes.");
  }
  if (bucket && bucket.until <= Date.now()) buckets().delete(email);
}

function markRecoveryFail(email: string): void {
  const map = buckets();
  const now = Date.now();
  const bucket = map.get(email);
  if (!bucket || bucket.until <= now) map.set(email, { fails: 1, until: now + 15 * 60_000 });
  else bucket.fails += 1;
}

function clearRecoveryFail(email: string): void {
  buckets().delete(email);
}

function invalid(): never {
  throw new Error("Requête invalide");
}

function asEmail(value: unknown): string {
  if (typeof value !== "string") invalid();
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) invalid();
  return email;
}

function asSalt(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid();
  if (value.length < 16 || value.length > 128) invalid();
  return value;
}

function asPack(value: unknown): string {
  if (typeof value !== "string" || value.length > 80_000) invalid();
  let parsed: { iv?: unknown; ct?: unknown };
  try {
    parsed = JSON.parse(value) as { iv?: unknown; ct?: unknown };
  } catch {
    invalid();
  }
  if (typeof parsed.iv !== "string" || typeof parsed.ct !== "string") invalid();
  if (parsed.iv.length > 64 || parsed.ct.length < 8 || parsed.ct.length > 60_000) invalid();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.iv) || !/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.ct)) {
    invalid();
  }
  return JSON.stringify({ iv: parsed.iv, ct: parsed.ct });
}

function asId(value: unknown): string {
  if (typeof value !== "string") invalid();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid();
  return value.toLowerCase();
}

function asPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 10 || value.length > 128 || value.includes("\0")) {
    throw new Error("Le mot de passe doit contenir entre 10 et 128 caractères.");
  }
  return value;
}

function asRecoveryCode(value: unknown): string {
  if (typeof value !== "string") invalid();
  const code = normalizeRecoveryCode(value);
  if (code.length < 20 || code.length > 40) throw new Error(FAIL_MESSAGE);
  return code;
}

function mapMeta(row: MetaRow): VaultMeta {
  return {
    kdfIters: Number(row.kdf_iters),
    kdfSalt: row.kdf_salt,
    dekPassword: row.dek_password,
    recoveryIters: Number(row.recovery_iters),
    recoverySalt: row.recovery_salt,
    dekRecovery: row.dek_recovery,
    recoveryHint: row.recovery_hint,
  };
}

async function db() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

let dummyHash: string | null = null;

async function recoveryMatches(hash: string | null, code: string): Promise<boolean> {
  const { hashPassword, verifyPassword } = await import("better-auth/crypto");
  const target = hash ?? (dummyHash ??= await hashPassword("coffre-dummy-recovery-verifier"));
  return verifyPassword({ hash: target, password: code });
}

export const getMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<VaultMeta | null> => {
    const sql = await db();
    const rows = await sql<MetaRow>`
      select kdf_iters, kdf_salt, dek_password, recovery_iters, recovery_salt, dek_recovery, recovery_hint
      from vault_meta
      where user_id = ${context.userId}
    `;
    const row = rows[0];
    return row ? mapMeta(row) : null;
  });

type SaveMetaInput = {
  kdfSalt: string;
  dekPassword: string;
  recoverySalt: string;
  dekRecovery: string;
  recoveryCode: string;
  recoveryHint: string;
};

export const saveMeta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SaveMetaInput) => ({
    kdfSalt: asSalt(input?.kdfSalt),
    dekPassword: asPack(input?.dekPassword),
    recoverySalt: asSalt(input?.recoverySalt),
    dekRecovery: asPack(input?.dekRecovery),
    recoveryCode: asRecoveryCode(input?.recoveryCode),
    recoveryHint: asPack(input?.recoveryHint),
  }))
  .handler(async ({ context, data }) => {
    const { hashPassword } = await import("better-auth/crypto");
    const recoveryHash = await hashPassword(data.recoveryCode);
    const sql = await db();
    await sql`
      insert into vault_meta (
        user_id, kdf_iters, kdf_salt, dek_password, recovery_iters, recovery_salt,
        dek_recovery, recovery_hash, recovery_hint
      ) values (
        ${context.userId}, ${KDF_ITERATIONS}, ${data.kdfSalt}, ${data.dekPassword},
        ${KDF_ITERATIONS}, ${data.recoverySalt}, ${data.dekRecovery}, ${recoveryHash},
        ${data.recoveryHint}
      )
      on conflict (user_id) do nothing
    `;
    return { ok: true as const };
  });

export const updatePasswordWrap = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { dekPassword: string }) => ({ dekPassword: asPack(input?.dekPassword) }))
  .handler(async ({ context, data }) => {
    const sql = await db();
    const rows = await sql<{ user_id: string }>`
      update vault_meta
      set dek_password = ${data.dekPassword}, updated_at = now()
      where user_id = ${context.userId}
      returning user_id
    `;
    if (!rows[0]) throw new Error("Coffre introuvable.");
    return { ok: true as const };
  });

function asFlag(value: unknown): boolean {
  if (typeof value !== "boolean") invalid();
  return value;
}

export const countVaultUsers = createServerFn({ method: "GET" }).handler(async (): Promise<number> => {
  const sql = await db();
  const rows = await sql<{ total: number | string }>`
    select count(distinct i.user_id)::int as total
    from vault_items i
    inner join "user" u on u.id = i.user_id
    where i.has_password = true
  `;
  return Number(rows[0]?.total ?? 0);
});

export const listItems = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StoredItem[]> => {
    const sql = await db();
    return sql<StoredItem>`
      select id, iv, ciphertext
      from vault_items
      where user_id = ${context.userId}
      order by created_at asc
    `;
  });

export const insertItems = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { items: StoredItem[] }) => {
    if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 80) {
      invalid();
    }
    return {
      items: input.items.map((item) => ({
        id: asId(item?.id),
        iv: asSalt(item?.iv),
        ciphertext: requireCipher(item?.ciphertext),
        hasPassword: asFlag(item?.hasPassword),
      })),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await db();
    const values: unknown[] = [];
    const chunks: string[] = [];
    data.items.forEach((item, index) => {
      const base = index * 5;
      chunks.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      values.push(item.id, context.userId, item.iv, item.ciphertext, item.hasPassword);
    });
    await sql.query(
      `insert into vault_items (id, user_id, iv, ciphertext, has_password) values ${chunks.join(", ")}
       on conflict (id) do nothing`,
      values,
    );
    return { ok: true as const };
  });

function requireCipher(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 4_500_000) invalid();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid();
  return value;
}

export const upsertItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: StoredItem) => ({
    id: asId(input?.id),
    iv: asSalt(input?.iv),
    ciphertext: requireCipher(input?.ciphertext),
    hasPassword: asFlag(input?.hasPassword),
  }))
  .handler(async ({ context, data }) => {
    const sql = await db();
    await sql`
      insert into vault_items (id, user_id, iv, ciphertext, has_password)
      values (${data.id}, ${context.userId}, ${data.iv}, ${data.ciphertext}, ${data.hasPassword})
      on conflict (id) do update
      set iv = excluded.iv,
          ciphertext = excluded.ciphertext,
          has_password = excluded.has_password,
          updated_at = now()
      where vault_items.user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteItems = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { ids: string[] }) => {
    if (!input || !Array.isArray(input.ids) || input.ids.length === 0 || input.ids.length > 80) invalid();
    return { ids: input.ids.map((id) => asId(id)) };
  })
  .handler(async ({ context, data }) => {
    const sql = await db();
    const placeholders = data.ids.map((_, index) => `$${index + 2}`).join(", ");
    await sql.query(
      `delete from vault_items where user_id = $1 and id in (${placeholders})`,
      [context.userId, ...data.ids],
    );
    return { ok: true as const };
  });

type RecoveryMaterial = {
  kdfIters: number;
  kdfSalt: string;
  recoveryIters: number;
  recoverySalt: string;
  dekRecovery: string;
};

export const openRecovery = createServerFn({ method: "POST" })
  .validator((input: { email: string; recoveryCode: string }) => ({
    email: asEmail(input?.email),
    recoveryCode: asRecoveryCode(input?.recoveryCode),
  }))
  .handler(async ({ data }): Promise<RecoveryMaterial> => {
    assertRecoveryAllowed(data.email);
    const sql = await db();
    const rows = await sql<{
      user_id: string;
      recovery_hash: string | null;
      kdf_iters: number | null;
      kdf_salt: string | null;
      recovery_iters: number | null;
      recovery_salt: string | null;
      dek_recovery: string | null;
    }>`
      select u.id as user_id, m.recovery_hash, m.kdf_iters, m.kdf_salt,
             m.recovery_iters, m.recovery_salt, m.dek_recovery
      from "user" u
      left join vault_meta m on m.user_id = u.id
      where lower(u.email) = ${data.email}
      limit 1
    `;
    const row = rows[0];
    const ok = await recoveryMatches(row?.recovery_hash ?? null, data.recoveryCode);
    if (!ok || !row?.kdf_salt || !row.recovery_salt || !row.dek_recovery) {
      markRecoveryFail(data.email);
      throw new Error(FAIL_MESSAGE);
    }
    clearRecoveryFail(data.email);
    return {
      kdfIters: Number(row.kdf_iters),
      kdfSalt: row.kdf_salt,
      recoveryIters: Number(row.recovery_iters),
      recoverySalt: row.recovery_salt,
      dekRecovery: row.dek_recovery,
    };
  });

export const finishRecovery = createServerFn({ method: "POST" })
  .validator((input: { email: string; recoveryCode: string; newPassword: string; dekPassword: string }) => ({
    email: asEmail(input?.email),
    recoveryCode: asRecoveryCode(input?.recoveryCode),
    newPassword: asPassword(input?.newPassword),
    dekPassword: asPack(input?.dekPassword),
  }))
  .handler(async ({ data }) => {
    assertRecoveryAllowed(data.email);
    const sql = await db();
    const rows = await sql<{ user_id: string; recovery_hash: string | null }>`
      select u.id as user_id, m.recovery_hash
      from "user" u
      left join vault_meta m on m.user_id = u.id
      where lower(u.email) = ${data.email}
      limit 1
    `;
    const row = rows[0];
    const ok = await recoveryMatches(row?.recovery_hash ?? null, data.recoveryCode);
    if (!ok || !row) {
      markRecoveryFail(data.email);
      throw new Error(FAIL_MESSAGE);
    }
    const { hashPassword } = await import("better-auth/crypto");
    const passwordHash = await hashPassword(data.newPassword);
    const updated = await sql.query<{ updated: number }>(
      `with acct as (
         update "account"
         set password = $3, "updatedAt" = now()
         where "userId" = $2 and "providerId" = 'credential'
         returning "userId"
       ),
       meta as (
         update vault_meta
         set dek_password = $1, updated_at = now()
         where user_id in (select "userId" from acct)
         returning user_id
       ),
       sess as (
         delete from "session"
         where "userId" in (select user_id from meta)
         returning "id"
       )
       select (select count(*)::int from meta) as updated`,
      [data.dekPassword, row.user_id, passwordHash],
    );
    if (!Number(updated[0]?.updated)) throw new Error("Réinitialisation impossible.");
    clearRecoveryFail(data.email);
    return { ok: true as const };
  });

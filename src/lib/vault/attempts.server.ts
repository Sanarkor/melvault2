import { getSql } from "@/lib/db";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 8;

export async function assertDbAttempt(bucket: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql<{ fails: number; window_start: string | Date }>`
    select fails, window_start from vault_attempts where bucket = ${bucket}
  `;
  const row = rows[0];
  if (!row) return;
  const start = new Date(row.window_start).getTime();
  if (!Number.isFinite(start) || Date.now() - start > WINDOW_MS) return;
  if (Number(row.fails) >= MAX_FAILS) {
    throw new Error("Trop de tentatives. Réessayez dans quelques minutes.");
  }
}

export async function markDbAttempt(bucket: string): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into vault_attempts (bucket, fails, window_start)
    values (${bucket}, 1, now())
    on conflict (bucket) do update
    set fails = case
          when vault_attempts.window_start < now() - interval '15 minutes' then 1
          else vault_attempts.fails + 1
        end,
        window_start = case
          when vault_attempts.window_start < now() - interval '15 minutes' then now()
          else vault_attempts.window_start
        end
  `;
}

export async function clearDbAttempt(bucket: string): Promise<void> {
  const sql = await getSql();
  await sql`delete from vault_attempts where bucket = ${bucket}`;
}

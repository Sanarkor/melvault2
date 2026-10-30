-- Vault ciphertext only. Secrets are encrypted in the browser; these columns
-- never contain a readable password, identifier, or note.
create table if not exists vault_meta (
  user_id text primary key,
  kdf_iters integer not null,
  kdf_salt text not null,
  dek_password text not null,
  recovery_iters integer not null,
  recovery_salt text not null,
  dek_recovery text not null,
  recovery_hash text not null,
  recovery_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vault_items (
  id text primary key,
  user_id text not null,
  iv text not null,
  ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_items_user_idx on vault_items (user_id);

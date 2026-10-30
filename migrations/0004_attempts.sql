create table if not exists vault_attempts (
  bucket text primary key,
  fails integer not null,
  window_start timestamptz not null default now()
);

-- Presence only: whether a stored account includes a password.
-- The password itself stays inside the ciphertext.
alter table vault_items
  add column if not exists has_password boolean not null default false;

-- Existing rows cannot be decrypted in SQL. They stay marked until the next
-- save, which records the real presence of the password field.
update vault_items set has_password = true;

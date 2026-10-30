import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { d as normalizeRecoveryCode, n as authMiddleware, t as KDF_ITERATIONS } from "./recovery-C7QWzwNy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-BzdodQQa.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FAIL_MESSAGE = "Code de récupération incorrect, ou aucun coffre pour cette adresse.";
var rlHost = globalThis;
function buckets() {
	rlHost.__coffreRecoveryRl ??= /* @__PURE__ */ new Map();
	return rlHost.__coffreRecoveryRl;
}
function assertRecoveryAllowed(email) {
	const bucket = buckets().get(email);
	if (bucket && bucket.until > Date.now() && bucket.fails >= 8) throw new Error("Trop de tentatives. Réessayez dans quelques minutes.");
	if (bucket && bucket.until <= Date.now()) buckets().delete(email);
}
function markRecoveryFail(email) {
	const map = buckets();
	const now = Date.now();
	const bucket = map.get(email);
	if (!bucket || bucket.until <= now) map.set(email, {
		fails: 1,
		until: now + 9e5
	});
	else bucket.fails += 1;
}
function clearRecoveryFail(email) {
	buckets().delete(email);
}
function invalid() {
	throw new Error("Requête invalide");
}
function asEmail(value) {
	if (typeof value !== "string") invalid();
	const email = value.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) invalid();
	return email;
}
function asSalt(value) {
	if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid();
	if (value.length < 16 || value.length > 128) invalid();
	return value;
}
function asPack(value) {
	if (typeof value !== "string" || value.length > 8e4) invalid();
	let parsed;
	try {
		parsed = JSON.parse(value);
	} catch {
		invalid();
	}
	if (typeof parsed.iv !== "string" || typeof parsed.ct !== "string") invalid();
	if (parsed.iv.length > 64 || parsed.ct.length < 8 || parsed.ct.length > 6e4) invalid();
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.iv) || !/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.ct)) invalid();
	return JSON.stringify({
		iv: parsed.iv,
		ct: parsed.ct
	});
}
function asId(value) {
	if (typeof value !== "string") invalid();
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid();
	return value.toLowerCase();
}
function asPassword(value) {
	if (typeof value !== "string" || value.length < 10 || value.length > 128 || value.includes("\0")) throw new Error("Le mot de passe doit contenir entre 10 et 128 caractères.");
	return value;
}
function asRecoveryCode(value) {
	if (typeof value !== "string") invalid();
	const code = normalizeRecoveryCode(value);
	if (code.length < 20 || code.length > 40) throw new Error(FAIL_MESSAGE);
	return code;
}
function mapMeta(row) {
	return {
		kdfIters: Number(row.kdf_iters),
		kdfSalt: row.kdf_salt,
		dekPassword: row.dek_password,
		recoveryIters: Number(row.recovery_iters),
		recoverySalt: row.recovery_salt,
		dekRecovery: row.dek_recovery,
		recoveryHint: row.recovery_hint
	};
}
async function db() {
	const { getSql } = await import("./db-DxG_aZ4y.mjs").then((n) => n.t).then((n) => n.t);
	return getSql();
}
var dummyHash = null;
async function recoveryMatches(hash, code) {
	const { hashPassword, verifyPassword } = await import("./crypto-CRvWCAfw.mjs").then((n) => n.t).then((n) => n.t);
	return verifyPassword({
		hash: hash ?? (dummyHash ??= await hashPassword("coffre-dummy-recovery-verifier")),
		password: code
	});
}
var getMeta_createServerFn_handler = createServerRpc({
	id: "031412856a17acc964d0b6d3249248978165ff75e587f85b1348738d097245d3",
	name: "getMeta",
	filename: "src/lib/vault/api.ts"
}, (opts) => getMeta.__executeServer(opts));
var getMeta = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMeta_createServerFn_handler, async ({ context }) => {
	const row = (await (await db())`
      select kdf_iters, kdf_salt, dek_password, recovery_iters, recovery_salt, dek_recovery, recovery_hint
      from vault_meta
      where user_id = ${context.userId}
    `)[0];
	return row ? mapMeta(row) : null;
});
var saveMeta_createServerFn_handler = createServerRpc({
	id: "5eefbb659cc18755fc1d15f20943afcc969ada610e13f261bf96fdf17f9f7760",
	name: "saveMeta",
	filename: "src/lib/vault/api.ts"
}, (opts) => saveMeta.__executeServer(opts));
var saveMeta = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	kdfSalt: asSalt(input?.kdfSalt),
	dekPassword: asPack(input?.dekPassword),
	recoverySalt: asSalt(input?.recoverySalt),
	dekRecovery: asPack(input?.dekRecovery),
	recoveryCode: asRecoveryCode(input?.recoveryCode),
	recoveryHint: asPack(input?.recoveryHint)
})).handler(saveMeta_createServerFn_handler, async ({ context, data }) => {
	const { hashPassword } = await import("./crypto-CRvWCAfw.mjs").then((n) => n.t).then((n) => n.t);
	const recoveryHash = await hashPassword(data.recoveryCode);
	await (await db())`
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
	return { ok: true };
});
var updatePasswordWrap_createServerFn_handler = createServerRpc({
	id: "3eb1d8aaba396a09de89f9b78c184ac8793f6ed3f02750b2192fac255f92a9af",
	name: "updatePasswordWrap",
	filename: "src/lib/vault/api.ts"
}, (opts) => updatePasswordWrap.__executeServer(opts));
var updatePasswordWrap = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({ dekPassword: asPack(input?.dekPassword) })).handler(updatePasswordWrap_createServerFn_handler, async ({ context, data }) => {
	if (!(await (await db())`
      update vault_meta
      set dek_password = ${data.dekPassword}, updated_at = now()
      where user_id = ${context.userId}
      returning user_id
    `)[0]) throw new Error("Coffre introuvable.");
	return { ok: true };
});
function asFlag(value) {
	if (typeof value !== "boolean") invalid();
	return value;
}
var countVaultUsers_createServerFn_handler = createServerRpc({
	id: "5ed64b7e36b0611419c1579350425fc4aea89af6a83c81dfbc7fc0a376356a11",
	name: "countVaultUsers",
	filename: "src/lib/vault/api.ts"
}, (opts) => countVaultUsers.__executeServer(opts));
var countVaultUsers = createServerFn({ method: "GET" }).handler(countVaultUsers_createServerFn_handler, async () => {
	const rows = await (await db())`
    select count(distinct i.user_id)::int as total
    from vault_items i
    inner join "user" u on u.id = i.user_id
    where i.has_password = true
  `;
	return Number(rows[0]?.total ?? 0);
});
var listItems_createServerFn_handler = createServerRpc({
	id: "f6193e7807ee9403b79f0780500ecefe585cae4a077b8e31104a52a0776357ba",
	name: "listItems",
	filename: "src/lib/vault/api.ts"
}, (opts) => listItems.__executeServer(opts));
var listItems = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listItems_createServerFn_handler, async ({ context }) => {
	return (await db())`
      select id, iv, ciphertext
      from vault_items
      where user_id = ${context.userId}
      order by created_at asc
    `;
});
var insertItems_createServerFn_handler = createServerRpc({
	id: "66bc813ed5ea6d9998ad81ee05f28dbb93b099dd1c320867722de142c965bc39",
	name: "insertItems",
	filename: "src/lib/vault/api.ts"
}, (opts) => insertItems.__executeServer(opts));
var insertItems = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 80) invalid();
	return { items: input.items.map((item) => ({
		id: asId(item?.id),
		iv: asSalt(item?.iv),
		ciphertext: requireCipher(item?.ciphertext),
		hasPassword: asFlag(item?.hasPassword)
	})) };
}).handler(insertItems_createServerFn_handler, async ({ context, data }) => {
	const sql = await db();
	const values = [];
	const chunks = [];
	data.items.forEach((item, index) => {
		const base = index * 5;
		chunks.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
		values.push(item.id, context.userId, item.iv, item.ciphertext, item.hasPassword);
	});
	await sql.query(`insert into vault_items (id, user_id, iv, ciphertext, has_password) values ${chunks.join(", ")}
       on conflict (id) do nothing`, values);
	return { ok: true };
});
function requireCipher(value) {
	if (typeof value !== "string" || value.length < 8 || value.length > 6e4) invalid();
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid();
	return value;
}
var upsertItem_createServerFn_handler = createServerRpc({
	id: "12cfb59c879c84b5dafcf9b479c60d792783a2bac766f305e520ea743ddbbe70",
	name: "upsertItem",
	filename: "src/lib/vault/api.ts"
}, (opts) => upsertItem.__executeServer(opts));
var upsertItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: asId(input?.id),
	iv: asSalt(input?.iv),
	ciphertext: requireCipher(input?.ciphertext),
	hasPassword: asFlag(input?.hasPassword)
})).handler(upsertItem_createServerFn_handler, async ({ context, data }) => {
	await (await db())`
      insert into vault_items (id, user_id, iv, ciphertext, has_password)
      values (${data.id}, ${context.userId}, ${data.iv}, ${data.ciphertext}, ${data.hasPassword})
      on conflict (id) do update
      set iv = excluded.iv,
          ciphertext = excluded.ciphertext,
          has_password = excluded.has_password,
          updated_at = now()
      where vault_items.user_id = ${context.userId}
    `;
	return { ok: true };
});
var deleteItems_createServerFn_handler = createServerRpc({
	id: "65acbc049cb4acc5f6c740d0d76921147e8dcf6590e01fcfdaa607edd5dd0f1b",
	name: "deleteItems",
	filename: "src/lib/vault/api.ts"
}, (opts) => deleteItems.__executeServer(opts));
var deleteItems = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.ids) || input.ids.length === 0 || input.ids.length > 80) invalid();
	return { ids: input.ids.map((id) => asId(id)) };
}).handler(deleteItems_createServerFn_handler, async ({ context, data }) => {
	const sql = await db();
	const placeholders = data.ids.map((_, index) => `$${index + 2}`).join(", ");
	await sql.query(`delete from vault_items where user_id = $1 and id in (${placeholders})`, [context.userId, ...data.ids]);
	return { ok: true };
});
var openRecovery_createServerFn_handler = createServerRpc({
	id: "56bbcaef8a0fa0d48f4395c65af45836d7bd630f2c9ec5820832d4a04eae5c57",
	name: "openRecovery",
	filename: "src/lib/vault/api.ts"
}, (opts) => openRecovery.__executeServer(opts));
var openRecovery = createServerFn({ method: "POST" }).validator((input) => ({
	email: asEmail(input?.email),
	recoveryCode: asRecoveryCode(input?.recoveryCode)
})).handler(openRecovery_createServerFn_handler, async ({ data }) => {
	assertRecoveryAllowed(data.email);
	const row = (await (await db())`
      select u.id as user_id, m.recovery_hash, m.kdf_iters, m.kdf_salt,
             m.recovery_iters, m.recovery_salt, m.dek_recovery
      from "user" u
      left join vault_meta m on m.user_id = u.id
      where lower(u.email) = ${data.email}
      limit 1
    `)[0];
	if (!await recoveryMatches(row?.recovery_hash ?? null, data.recoveryCode) || !row?.kdf_salt || !row.recovery_salt || !row.dek_recovery) {
		markRecoveryFail(data.email);
		throw new Error(FAIL_MESSAGE);
	}
	clearRecoveryFail(data.email);
	return {
		kdfIters: Number(row.kdf_iters),
		kdfSalt: row.kdf_salt,
		recoveryIters: Number(row.recovery_iters),
		recoverySalt: row.recovery_salt,
		dekRecovery: row.dek_recovery
	};
});
var finishRecovery_createServerFn_handler = createServerRpc({
	id: "7982ec8daa485beeabc7e7f808761cf64dd6a88273f6bee7b23533c6d4abe36a",
	name: "finishRecovery",
	filename: "src/lib/vault/api.ts"
}, (opts) => finishRecovery.__executeServer(opts));
var finishRecovery = createServerFn({ method: "POST" }).validator((input) => ({
	email: asEmail(input?.email),
	recoveryCode: asRecoveryCode(input?.recoveryCode),
	newPassword: asPassword(input?.newPassword),
	dekPassword: asPack(input?.dekPassword)
})).handler(finishRecovery_createServerFn_handler, async ({ data }) => {
	assertRecoveryAllowed(data.email);
	const sql = await db();
	const row = (await sql`
      select u.id as user_id, m.recovery_hash
      from "user" u
      left join vault_meta m on m.user_id = u.id
      where lower(u.email) = ${data.email}
      limit 1
    `)[0];
	if (!await recoveryMatches(row?.recovery_hash ?? null, data.recoveryCode) || !row) {
		markRecoveryFail(data.email);
		throw new Error(FAIL_MESSAGE);
	}
	const { hashPassword } = await import("./crypto-CRvWCAfw.mjs").then((n) => n.t).then((n) => n.t);
	const passwordHash = await hashPassword(data.newPassword);
	const updated = await sql.query(`with acct as (
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
       select (select count(*)::int from meta) as updated`, [
		data.dekPassword,
		row.user_id,
		passwordHash
	]);
	if (!Number(updated[0]?.updated)) throw new Error("Réinitialisation impossible.");
	clearRecoveryFail(data.email);
	return { ok: true };
});
//#endregion
export { countVaultUsers_createServerFn_handler, deleteItems_createServerFn_handler, finishRecovery_createServerFn_handler, getMeta_createServerFn_handler, insertItems_createServerFn_handler, listItems_createServerFn_handler, openRecovery_createServerFn_handler, saveMeta_createServerFn_handler, updatePasswordWrap_createServerFn_handler, upsertItem_createServerFn_handler };

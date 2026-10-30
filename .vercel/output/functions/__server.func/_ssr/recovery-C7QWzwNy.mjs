import { t as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/recovery-C7QWzwNy.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-CH2mWUg4.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-D1s35xq3.mjs");
	const { requireUserId } = await import("./verify.server-BvQ4VyLs.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function isCategoryId(value) {
	return typeof value === "string" && value.length <= 40 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
var LEGACY_CATEGORIES = {
	emails: "mail",
	social: "internet",
	entertainment: "entertainment",
	shopping: "shopping",
	work: "internet",
	home: "internet",
	travel: "travel",
	tech: "internet",
	studies: "school",
	other: "internet"
};
function categoryOf(value) {
	if (typeof value === "string" && value in LEGACY_CATEGORIES) return LEGACY_CATEGORIES[value];
	if (isCategoryId(value)) return value;
	return "internet";
}
function normalizeAccount(input) {
	if (!input || typeof input !== "object") return null;
	const row = input;
	const service = typeof row.service === "string" ? row.service.trim().slice(0, 120) : "";
	if (!service) return null;
	const text = (key, max) => typeof row[key] === "string" ? row[key].slice(0, max) : "";
	return {
		service,
		category: categoryOf(row.category),
		username: text("username", 200),
		email: text("email", 200),
		password: text("password", 256),
		phone: text("phone", 40),
		notes: text("notes", 2e3)
	};
}
function compteLabel(count) {
	return count === 1 ? "1 compte" : `${count} comptes`;
}
var KDF_ITERATIONS = 21e4;
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function randomBytes(length) {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return bytes;
}
function b64(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
function unb64(value) {
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 === 1) throw new Error("Donnée chiffrée invalide");
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
async function deriveAesKey(secret, salt, iterations, usages) {
	const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"]);
	const saltCopy = new Uint8Array(salt);
	return crypto.subtle.deriveKey({
		name: "PBKDF2",
		salt: saltCopy,
		iterations,
		hash: "SHA-256"
	}, material, {
		name: "AES-GCM",
		length: 256
	}, false, usages);
}
async function encryptBytes(key, data) {
	const iv = randomBytes(12);
	const cipher = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, key, new Uint8Array(data));
	return {
		iv: b64(iv),
		ct: b64(new Uint8Array(cipher))
	};
}
async function decryptBytes(key, pack) {
	const plain = await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: unb64(pack.iv)
	}, key, unb64(pack.ct));
	return new Uint8Array(plain);
}
async function encryptJson(key, value) {
	return encryptBytes(key, encoder.encode(JSON.stringify(value)));
}
async function decryptJson(key, pack) {
	const bytes = await decryptBytes(key, pack);
	return JSON.parse(decoder.decode(bytes));
}
async function createDek() {
	return crypto.subtle.generateKey({
		name: "AES-GCM",
		length: 256
	}, true, ["encrypt", "decrypt"]);
}
async function wrapDek(dek, kek) {
	return encryptBytes(kek, new Uint8Array(await crypto.subtle.exportKey("raw", dek)));
}
async function unwrapDek(pack, kek) {
	const raw = await decryptBytes(kek, pack);
	return crypto.subtle.importKey("raw", new Uint8Array(raw), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}
function parsePack(value) {
	const parsed = JSON.parse(value);
	if (!parsed || typeof parsed.iv !== "string" || typeof parsed.ct !== "string") throw new Error("Coffre illisible");
	return {
		iv: parsed.iv,
		ct: parsed.ct
	};
}
async function sealAccount(dek, account) {
	const pack = await encryptJson(dek, account);
	return {
		id: crypto.randomUUID(),
		iv: pack.iv,
		ciphertext: pack.ct
	};
}
async function openAccount(dek, iv, ciphertext) {
	const account = normalizeAccount(await decryptJson(dek, {
		iv,
		ct: ciphertext
	}));
	if (!account) throw new Error("Entrée illisible");
	return account;
}
async function buildExportFile(accounts, passphrase) {
	const salt = randomBytes(16);
	const pack = await encryptJson(await deriveAesKey(passphrase, salt, KDF_ITERATIONS, ["encrypt"]), { accounts });
	return JSON.stringify({
		format: "coffre-personnel",
		version: 1,
		kdf: "PBKDF2-SHA256",
		iterations: KDF_ITERATIONS,
		salt: b64(salt),
		iv: pack.iv,
		ct: pack.ct
	});
}
async function readExportFile(fileText, passphrase) {
	if (fileText.length > 2e6) throw new Error("Fichier trop volumineux.");
	let parsed;
	try {
		parsed = JSON.parse(fileText);
	} catch {
		throw new Error("Fichier illisible.");
	}
	if (parsed.format !== "coffre-personnel" || parsed.version !== 1) throw new Error("Ce fichier n'est pas un coffre chiffré.");
	const iterations = Number(parsed.iterations);
	if (!Number.isFinite(iterations) || iterations < 1e4 || iterations > 5e5) throw new Error("Fichier invalide.");
	if (typeof parsed.salt !== "string" || typeof parsed.iv !== "string" || typeof parsed.ct !== "string") throw new Error("Fichier invalide.");
	try {
		const data = await decryptJson(await deriveAesKey(passphrase, unb64(parsed.salt), iterations, ["decrypt"]), {
			iv: parsed.iv,
			ct: parsed.ct
		});
		if (!Array.isArray(data.accounts)) throw new Error("Fichier invalide.");
		return data.accounts.map((entry) => normalizeAccount(entry)).filter((entry) => entry !== null);
	} catch (error) {
		if (error instanceof Error && /fichier|coffre|invalide|illisible/i.test(error.message)) throw error;
		throw new Error("Phrase secrète incorrecte ou fichier endommagé.");
	}
}
var RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Strip spaces and dashes. The stored verifier uses this form. */
function normalizeRecoveryCode(input) {
	return input.toUpperCase().replace(/[^A-Z2-9]/g, "");
}
function randomIndex(size) {
	if (size <= 0 || size > 256) throw new Error("Taille invalide");
	const max = Math.floor(256 / size) * size;
	const buf = /* @__PURE__ */ new Uint8Array(1);
	let value = 256;
	while (value >= max) {
		crypto.getRandomValues(buf);
		value = buf[0] ?? 256;
	}
	return value % size;
}
/** 24 symbols, grouped for reading. About 120 bits. */
function generateRecoveryCode() {
	let raw = "";
	for (let i = 0; i < 24; i += 1) raw += RECOVERY_ALPHABET[randomIndex(32)];
	return raw.replace(/(.{4})(?!$)/g, "$1-");
}
//#endregion
export { unb64 as _, compteLabel as a, deriveAesKey as c, normalizeRecoveryCode as d, openAccount as f, sealAccount as g, readExportFile as h, buildExportFile as i, encryptJson as l, randomBytes as m, authMiddleware as n, createDek as o, parsePack as p, b64 as r, decryptJson as s, KDF_ITERATIONS as t, generateRecoveryCode as u, unwrapDek as v, wrapDek as y };

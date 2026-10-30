import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { _ as unb64, c as deriveAesKey, d as normalizeRecoveryCode, g as sealAccount, h as readExportFile, i as buildExportFile, l as encryptJson, m as randomBytes, n as authMiddleware, o as createDek, p as parsePack, r as b64, t as KDF_ITERATIONS, u as generateRecoveryCode, v as unwrapDek, y as wrapDek } from "./recovery-C7QWzwNy.mjs";
import { t as authClient } from "./client-CH2mWUg4.mjs";
import { _ as EyeOff, g as Eye } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-mbg_4kgT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
var SETS = {
	upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	lower: "abcdefghijklmnopqrstuvwxyz",
	digits: "0123456789",
	symbols: "!@#$%^&*()-_=+?"
};
function randomIndex(size) {
	const max = Math.floor(256 / size) * size;
	const buf = /* @__PURE__ */ new Uint8Array(1);
	let value = 256;
	while (value >= max) {
		crypto.getRandomValues(buf);
		value = buf[0] ?? 256;
	}
	return value % size;
}
function generatePassword(options) {
	const pools = [];
	if (options.upper) pools.push(SETS.upper);
	if (options.lower) pools.push(SETS.lower);
	if (options.digits) pools.push(SETS.digits);
	if (options.symbols) pools.push(SETS.symbols);
	if (pools.length === 0) throw new Error("Choisissez au moins un type de caractère.");
	const all = pools.join("");
	const length = Math.min(48, Math.max(12, Math.round(options.length)));
	const chars = pools.map((pool) => pool[randomIndex(pool.length)] ?? "");
	while (chars.length < length) chars.push(all[randomIndex(all.length)] ?? "");
	for (let i = chars.length - 1; i > 0; i -= 1) {
		const j = randomIndex(i + 1);
		const swap = chars[i] ?? "";
		chars[i] = chars[j] ?? "";
		chars[j] = swap;
	}
	return chars.join("");
}
function strengthOf(password) {
	if (!password) return {
		score: 0,
		label: "Vide"
	};
	let size = 0;
	if (/[A-Z]/.test(password)) size += 26;
	if (/[a-z]/.test(password)) size += 26;
	if (/\d/.test(password)) size += 10;
	if (/[^A-Za-z0-9]/.test(password)) size += 22;
	const entropy = password.length * Math.log2(Math.max(size, 2));
	if (entropy < 45) return {
		score: 0,
		label: "Faible"
	};
	if (entropy < 65) return {
		score: 1,
		label: "Moyen"
	};
	if (entropy < 85) return {
		score: 2,
		label: "Fort"
	};
	return {
		score: 3,
		label: "Très fort"
	};
}
function Mark({ large = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/icon-192.png",
		alt: "",
		width: large ? 128 : 44,
		height: large ? 128 : 44,
		className: large ? "mark mark-lg" : "mark"
	});
}
function Brand({ subtitle, large = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: large ? "brand brand-lg" : "brand",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { large }), large ? subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: subtitle
		}) : null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl leading-none tracking-tight",
				children: "MELVAULT"
			}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: subtitle
			}) : null]
		})]
	});
}
function PageSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-11 animate-pulse rounded-control bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "card h-28 animate-pulse" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "card h-28 animate-pulse" })
		]
	});
}
function Field({ label, children, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-1.5 block text-sm font-medium",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1.5 block text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
function SecretField({ label, value, onChange, autoComplete, placeholder }) {
	const [shown, setShown] = (0, import_react.useState)(false);
	const id = (0, import_react.useId)();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		htmlFor: id,
		className: "mb-1.5 block text-sm font-medium",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			id,
			className: "field pr-12",
			type: shown ? "text" : "password",
			value,
			autoComplete,
			spellCheck: false,
			autoCapitalize: "off",
			autoCorrect: "off",
			placeholder,
			onChange: (event) => onChange(event.target.value)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "icon-btn absolute top-1 right-1",
			"aria-label": shown ? "Masquer le mot de passe" : "Afficher le mot de passe",
			onClick: () => setShown((current) => !current),
			children: shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
		})]
	})] });
}
function StrengthMeter({ password }) {
	if (!password) return null;
	const strength = strengthOf(password);
	const tone = strength.score === 0 ? "bg-danger" : strength.score === 1 ? "bg-subtle" : "bg-ok";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-1",
			"aria-hidden": "true",
			children: [
				0,
				1,
				2,
				3
			].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1 flex-1 rounded-full ${index <= strength.score ? tone : "bg-line"}` }, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-xs text-muted",
			children: ["Force : ", strength.label]
		})]
	});
}
function Dialog({ title, onClose, children }) {
	(0, import_react.useEffect)(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", onKey);
		};
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "modal-root",
		onMouseDown: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "modal-panel",
			onMouseDown: (event) => event.stopPropagation(),
			children
		})
	});
}
function Alert({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		role: "alert",
		className: "rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-danger",
		children
	});
}
/** Fictional accounts for trying the vault. Not real credentials. */
var DEMO_ACCOUNTS = [
	{
		service: "Gmail principal",
		category: "mail",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "TestMail!4827",
		phone: "+33 6 00 00 00 01",
		notes: ""
	},
	{
		service: "Gmail secondaire",
		category: "mail",
		username: "alex.martin2",
		email: "alex.martin2@example.com",
		password: "DemoGmail!7392",
		phone: "",
		notes: ""
	},
	{
		service: "Outlook",
		category: "mail",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "OutlookDemo#5831",
		phone: "",
		notes: ""
	},
	{
		service: "Proton Mail",
		category: "mail",
		username: "alexmartin",
		email: "alexmartin@proton.example",
		password: "ProtonTest!9274",
		phone: "",
		notes: ""
	},
	{
		service: "Instagram",
		category: "internet",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "InstaDemo!2846",
		phone: "",
		notes: ""
	},
	{
		service: "Facebook",
		category: "internet",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "FacebookTest!6519",
		phone: "",
		notes: ""
	},
	{
		service: "X / Twitter",
		category: "internet",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "TwitterDemo!4382",
		phone: "",
		notes: ""
	},
	{
		service: "TikTok",
		category: "internet",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "TikTokTest!7264",
		phone: "",
		notes: ""
	},
	{
		service: "Discord",
		category: "internet",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "DiscordDemo!9153",
		phone: "",
		notes: ""
	},
	{
		service: "Twitch",
		category: "entertainment",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "TwitchTest!3671",
		phone: "",
		notes: ""
	},
	{
		service: "Steam principal",
		category: "games",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "SteamDemo!5824",
		phone: "",
		notes: "Compte principal"
	},
	{
		service: "Steam secondaire",
		category: "games",
		username: "alexmartin2",
		email: "alex.martin2@example.com",
		password: "SteamTest!7419",
		phone: "",
		notes: "Deuxième compte"
	},
	{
		service: "Epic Games",
		category: "games",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "EpicDemo!3962",
		phone: "",
		notes: ""
	},
	{
		service: "EA / Apex",
		category: "games",
		username: "AlexMartin86",
		email: "alexmartin@example.net",
		password: "EATest!8247",
		phone: "",
		notes: "Compte principal"
	},
	{
		service: "Ubisoft",
		category: "games",
		username: "AlexMartin86",
		email: "alexmartin@example.net",
		password: "UbiDemo!5138",
		phone: "",
		notes: ""
	},
	{
		service: "Riot Games",
		category: "games",
		username: "alexmartin",
		email: "alexmartin@example.com",
		password: "RiotTest!6942",
		phone: "",
		notes: ""
	},
	{
		service: "Battle.net",
		category: "games",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "BattleDemo!2857",
		phone: "",
		notes: ""
	},
	{
		service: "PlayStation",
		category: "games",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "PSNTest!6314",
		phone: "",
		notes: ""
	},
	{
		service: "Nintendo",
		category: "games",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "NintendoDemo!4728",
		phone: "",
		notes: ""
	},
	{
		service: "Netflix",
		category: "entertainment",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "NetflixDemo!8352",
		phone: "",
		notes: ""
	},
	{
		service: "Disney+",
		category: "entertainment",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "DisneyTest!2947",
		phone: "",
		notes: ""
	},
	{
		service: "Amazon Prime",
		category: "entertainment",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "AmazonDemo!6483",
		phone: "",
		notes: ""
	},
	{
		service: "Spotify",
		category: "entertainment",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "SpotifyTest!5271",
		phone: "",
		notes: ""
	},
	{
		service: "Cdiscount",
		category: "shopping",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "CdiscountDemo!3826",
		phone: "",
		notes: ""
	},
	{
		service: "Veepee",
		category: "shopping",
		username: "alexmartin",
		email: "alex.martin@example.com",
		password: "VeepeeTest!7194",
		phone: "",
		notes: ""
	},
	{
		service: "Kiabi",
		category: "shopping",
		username: "alexmartin",
		email: "alexmartin@example.com",
		password: "KiabiDemo!4638",
		phone: "",
		notes: ""
	},
	{
		service: "Decathlon",
		category: "shopping",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "DecathlonTest!8273",
		phone: "",
		notes: ""
	},
	{
		service: "Microsoft",
		category: "internet",
		username: "alexmartin",
		email: "alexmartin@example.com",
		password: "MicrosoftDemo!5937",
		phone: "",
		notes: ""
	},
	{
		service: "Samsung",
		category: "telephony",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "SamsungTest!4286",
		phone: "",
		notes: ""
	},
	{
		service: "NVIDIA",
		category: "internet",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "NvidiaDemo!7513",
		phone: "",
		notes: ""
	},
	{
		service: "NordVPN",
		category: "internet",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "NordVPNTest!6392",
		phone: "+33 6 00 00 00 02",
		notes: ""
	},
	{
		service: "MEGA",
		category: "internet",
		username: "alexmartin",
		email: "alexmartin@example.net",
		password: "MegaDemo!2841",
		phone: "",
		notes: ""
	},
	{
		service: "EduConnect",
		category: "school",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "EduDemo!5837",
		phone: "",
		notes: ""
	},
	{
		service: "ENT",
		category: "school",
		username: "alex.martin",
		email: "alex.martin@example.com",
		password: "EntTest!7412",
		phone: "",
		notes: ""
	},
	{
		service: "Plateforme scolaire",
		category: "school",
		username: "alexmartin",
		email: "alexmartin@example.com",
		password: "SchoolDemo!6294",
		phone: "",
		notes: ""
	}
];
var dek = null;
var version = 0;
var listeners = /* @__PURE__ */ new Set();
function getDek() {
	return dek;
}
function subscribeUnlock(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function setDek(next) {
	dek = next;
	version += 1;
	listeners.forEach((listener) => listener());
}
var BEARER_KEY = "grok-auth.bearer-token";
function rememberBearer(token) {
	if (typeof window === "undefined" || !token) return;
	try {
		window.sessionStorage.setItem(BEARER_KEY, token);
	} catch {}
}
function demoStorageKey(userId) {
	return `coffre.demo.${userId}`;
}
function readDemoIds(userId) {
	try {
		const raw = localStorage.getItem(demoStorageKey(userId));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
	} catch {
		return [];
	}
}
function writeDemoIds(userId, ids) {
	localStorage.setItem(demoStorageKey(userId), JSON.stringify(ids));
}
function clearDemoIds(userId) {
	localStorage.removeItem(demoStorageKey(userId));
}
var LOCK_KEY = "coffre.lockMinutes";
function readLockMinutes() {
	try {
		const raw = localStorage.getItem(LOCK_KEY);
		const value = raw ? Number(raw) : 5;
		return [
			1,
			5,
			15,
			30
		].includes(value) ? value : 5;
	} catch {
		return 5;
	}
}
function writeLockMinutes(minutes) {
	localStorage.setItem(LOCK_KEY, String(minutes));
}
var REMEMBER_KEY = "coffre.rememberLogin";
function readRememberedLogin() {
	try {
		const raw = localStorage.getItem(REMEMBER_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (typeof parsed.email !== "string" || typeof parsed.password !== "string") return null;
		const email = parsed.email.trim().toLowerCase();
		if (!email || !parsed.password) return null;
		return {
			email,
			password: parsed.password
		};
	} catch {
		return null;
	}
}
function writeRememberedLogin(email, password) {
	const normalized = email.trim().toLowerCase();
	if (!normalized || !password) return;
	localStorage.setItem(REMEMBER_KEY, JSON.stringify({
		email: normalized,
		password
	}));
}
function clearRememberedLogin() {
	localStorage.removeItem(REMEMBER_KEY);
}
var CATALOG_PREFIX = "coffre.categories.";
function readCategoryCatalog(userId) {
	try {
		const raw = localStorage.getItem(CATALOG_PREFIX + userId);
		if (!raw) return {
			removed: [],
			added: []
		};
		const parsed = JSON.parse(raw);
		return {
			removed: Array.isArray(parsed.removed) ? parsed.removed.filter((id) => typeof id === "string") : [],
			added: Array.isArray(parsed.added) ? parsed.added.flatMap((entry) => {
				if (!entry || typeof entry !== "object") return [];
				const row = entry;
				if (typeof row.id !== "string" || typeof row.label !== "string") return [];
				return [{
					id: row.id,
					label: row.label
				}];
			}) : []
		};
	} catch {
		return {
			removed: [],
			added: []
		};
	}
}
function writeCategoryCatalog(userId, catalog) {
	localStorage.setItem(CATALOG_PREFIX + userId, JSON.stringify(catalog));
}
function rotateRememberedPassword(currentPassword, nextPassword) {
	const saved = readRememberedLogin();
	if (!saved || saved.password !== currentPassword || !nextPassword) return;
	writeRememberedLogin(saved.email, nextPassword);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FAIL_MESSAGE = "Code de récupération incorrect, ou aucun coffre pour cette adresse.";
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
var getMeta = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("031412856a17acc964d0b6d3249248978165ff75e587f85b1348738d097245d3"));
var saveMeta = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	kdfSalt: asSalt(input?.kdfSalt),
	dekPassword: asPack(input?.dekPassword),
	recoverySalt: asSalt(input?.recoverySalt),
	dekRecovery: asPack(input?.dekRecovery),
	recoveryCode: asRecoveryCode(input?.recoveryCode),
	recoveryHint: asPack(input?.recoveryHint)
})).handler(createSsrRpc("5eefbb659cc18755fc1d15f20943afcc969ada610e13f261bf96fdf17f9f7760"));
var updatePasswordWrap = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({ dekPassword: asPack(input?.dekPassword) })).handler(createSsrRpc("3eb1d8aaba396a09de89f9b78c184ac8793f6ed3f02750b2192fac255f92a9af"));
function asFlag(value) {
	if (typeof value !== "boolean") invalid();
	return value;
}
var countVaultUsers = createServerFn({ method: "GET" }).handler(createSsrRpc("5ed64b7e36b0611419c1579350425fc4aea89af6a83c81dfbc7fc0a376356a11"));
var listItems = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f6193e7807ee9403b79f0780500ecefe585cae4a077b8e31104a52a0776357ba"));
var insertItems = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 80) invalid();
	return { items: input.items.map((item) => ({
		id: asId(item?.id),
		iv: asSalt(item?.iv),
		ciphertext: requireCipher(item?.ciphertext),
		hasPassword: asFlag(item?.hasPassword)
	})) };
}).handler(createSsrRpc("66bc813ed5ea6d9998ad81ee05f28dbb93b099dd1c320867722de142c965bc39"));
function requireCipher(value) {
	if (typeof value !== "string" || value.length < 8 || value.length > 6e4) invalid();
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid();
	return value;
}
var upsertItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: asId(input?.id),
	iv: asSalt(input?.iv),
	ciphertext: requireCipher(input?.ciphertext),
	hasPassword: asFlag(input?.hasPassword)
})).handler(createSsrRpc("12cfb59c879c84b5dafcf9b479c60d792783a2bac766f305e520ea743ddbbe70"));
var deleteItems = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (!input || !Array.isArray(input.ids) || input.ids.length === 0 || input.ids.length > 80) invalid();
	return { ids: input.ids.map((id) => asId(id)) };
}).handler(createSsrRpc("65acbc049cb4acc5f6c740d0d76921147e8dcf6590e01fcfdaa607edd5dd0f1b"));
var openRecovery = createServerFn({ method: "POST" }).validator((input) => ({
	email: asEmail(input?.email),
	recoveryCode: asRecoveryCode(input?.recoveryCode)
})).handler(createSsrRpc("56bbcaef8a0fa0d48f4395c65af45836d7bd630f2c9ec5820832d4a04eae5c57"));
var finishRecovery = createServerFn({ method: "POST" }).validator((input) => ({
	email: asEmail(input?.email),
	recoveryCode: asRecoveryCode(input?.recoveryCode),
	newPassword: asPassword(input?.newPassword),
	dekPassword: asPack(input?.dekPassword)
})).handler(createSsrRpc("7982ec8daa485beeabc7e7f808761cf64dd6a88273f6bee7b23533c6d4abe36a"));
function emails() {
	return authClient;
}
function errorText(error) {
	if (!(error instanceof Error)) return "Une erreur est survenue.";
	const message = error.message.trim();
	if (!message || message.length > 280) return "Une erreur est survenue.";
	return message;
}
function mapAuthError(message) {
	const text = (message ?? "").toLowerCase();
	if (text.includes("exist") || text.includes("already")) return "Un coffre existe déjà pour cette adresse.";
	if (text.includes("origin")) return "Connexion refusée. Rechargez la page et réessayez.";
	if (text.includes("short") || text.includes("password") && text.includes("8")) return "Mot de passe trop court. 10 caractères minimum.";
	if (text.includes("invalid email")) return "Adresse e-mail invalide.";
	if (text.includes("invalid") || text.includes("password") || text.includes("credential")) return "E-mail ou mot de passe incorrect.";
	return "Impossible de continuer. Réessayez.";
}
async function establishSession(token) {
	rememberBearer(token);
	const session = await emails().getSession();
	if (session.error || !session.data?.user) throw new Error("La session n'a pas pu être ouverte.");
}
async function signUpEmail(email, password) {
	const name = email.split("@")[0]?.slice(0, 40) || "Coffre";
	const result = await emails().signUp.email({
		email,
		password,
		name
	});
	if (result.error || !result.data?.user) throw new Error(mapAuthError(result.error?.message));
	await establishSession(result.data.token);
	return result.data.user;
}
async function signInEmail(email, password) {
	const result = await emails().signIn.email({
		email,
		password
	});
	if (result.error || !result.data?.user) throw new Error(mapAuthError(result.error?.message));
	await establishSession(result.data.token);
	return result.data.user;
}
async function changeLoginPassword(currentPassword, newPassword) {
	const result = await emails().changePassword({
		currentPassword,
		newPassword,
		revokeOtherSessions: true
	});
	if (result.error) throw new Error(mapAuthError(result.error.message));
}
var keyUsages = ["encrypt", "decrypt"];
async function createVault(password) {
	const recoveryCode = generateRecoveryCode();
	const dek = await createDek();
	const kdfSalt = randomBytes(16);
	const recoverySalt = randomBytes(16);
	const passKek = await deriveAesKey(password, kdfSalt, KDF_ITERATIONS, keyUsages);
	const recKek = await deriveAesKey(normalizeRecoveryCode(recoveryCode), recoverySalt, KDF_ITERATIONS, keyUsages);
	const dekPassword = await wrapDek(dek, passKek);
	const dekRecovery = await wrapDek(dek, recKek);
	const hint = await encryptJson(dek, { code: recoveryCode });
	await saveMeta({ data: {
		kdfSalt: b64(kdfSalt),
		dekPassword: JSON.stringify(dekPassword),
		recoverySalt: b64(recoverySalt),
		dekRecovery: JSON.stringify(dekRecovery),
		recoveryCode,
		recoveryHint: JSON.stringify(hint)
	} });
	const items = [];
	for (const account of DEMO_ACCOUNTS) {
		const sealed = await sealAccount(dek, account);
		items.push({
			...sealed,
			hasPassword: account.password.trim().length > 0
		});
	}
	await insertItems({ data: { items } });
	return {
		dek,
		recoveryCode,
		demoIds: items.map((item) => item.id)
	};
}
async function unlockVault(password, meta) {
	try {
		const kek = await deriveAesKey(password, unb64(meta.kdfSalt), meta.kdfIters, keyUsages);
		return await unwrapDek(parsePack(meta.dekPassword), kek);
	} catch {
		throw new Error("Mot de passe incorrect.");
	}
}
async function rewrapWithPassword(dek, meta, password) {
	const kek = await deriveAesKey(password, unb64(meta.kdfSalt), meta.kdfIters, keyUsages);
	return JSON.stringify(await wrapDek(dek, kek));
}
async function resetWithRecovery(email, recoveryCode, newPassword) {
	const opened = await openRecovery({ data: {
		email,
		recoveryCode
	} });
	let dek;
	try {
		const kek = await deriveAesKey(normalizeRecoveryCode(recoveryCode), unb64(opened.recoverySalt), opened.recoveryIters, keyUsages);
		dek = await unwrapDek(parsePack(opened.dekRecovery), kek);
	} catch {
		throw new Error("Ce code ne permet pas de déchiffrer le coffre.");
	}
	const passKek = await deriveAesKey(newPassword, unb64(opened.kdfSalt), opened.kdfIters, keyUsages);
	await finishRecovery({ data: {
		email,
		recoveryCode,
		newPassword,
		dekPassword: JSON.stringify(await wrapDek(dek, passKek))
	} });
}
async function savePasswordWrap(dekPassword) {
	await updatePasswordWrap({ data: { dekPassword } });
}
async function exportVault(accounts, passphrase) {
	return buildExportFile(accounts, passphrase);
}
async function importVault(fileText, passphrase) {
	return readExportFile(fileText, passphrase);
}
//#endregion
export { savePasswordWrap as A, writeLockMinutes as B, readCategoryCatalog as C, resetWithRecovery as D, readRememberedLogin as E, unlockVault as F, upsertItem as I, useCurrentUserState as L, signInEmail as M, signUpEmail as N, rewrapWithPassword as O, subscribeUnlock as P, writeCategoryCatalog as R, listItems as S, readLockMinutes as T, writeRememberedLogin as V, generatePassword as _, Mark as a, importVault as b, StrengthMeter as c, clearRememberedLogin as d, countVaultUsers as f, exportVault as g, errorText as h, Field as i, setDek as j, rotateRememberedPassword as k, changeLoginPassword as l, deleteItems as m, Brand as n, PageSkeleton as o, createVault as p, Dialog as r, SecretField as s, Alert as t, clearDemoIds as u, getDek as v, readDemoIds as w, insertItems as x, getMeta as y, writeDemoIds as z };

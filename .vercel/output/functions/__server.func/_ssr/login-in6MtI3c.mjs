import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, b as Navigate, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as resetWithRecovery, E as readRememberedLogin, F as unlockVault, L as useCurrentUserState, M as signInEmail, N as signUpEmail, V as writeRememberedLogin, c as StrengthMeter, d as clearRememberedLogin, f as countVaultUsers, h as errorText, i as Field, j as setDek, n as Brand, o as PageSkeleton, p as createVault, s as SecretField, t as Alert, y as getMeta, z as writeDemoIds } from "./actions-mbg_4kgT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-in6MtI3c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthScreen({ holdSession, releaseSession }) {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("login");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [recoveryCode, setRecoveryCode] = (0, import_react.useState)("");
	const [shownCode, setShownCode] = (0, import_react.useState)(null);
	const [kept, setKept] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [userCount, setUserCount] = (0, import_react.useState)(null);
	const [remember, setRemember] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const saved = readRememberedLogin();
		if (!saved) return;
		setEmail(saved.email);
		setPassword(saved.password);
		setRemember(true);
	}, []);
	(0, import_react.useEffect)(() => {
		let active = true;
		countVaultUsers().then((count) => {
			if (active) setUserCount(count);
		}).catch(() => {
			if (active) setUserCount(null);
		});
		return () => {
			active = false;
		};
	}, []);
	function switchMode(next) {
		setMode(next);
		setError(null);
		setNotice(null);
	}
	async function onLogin(event) {
		event.preventDefault();
		setPending(true);
		setError(null);
		setNotice(null);
		try {
			holdSession();
			await signInEmail(email.trim(), password);
			const meta = await getMeta();
			if (meta) try {
				setDek(await unlockVault(password, meta));
			} catch {
				setDek(null);
			}
			if (remember) writeRememberedLogin(email, password);
			else clearRememberedLogin();
			setPassword("");
			releaseSession();
			await navigate({ to: "/" });
		} catch (caught) {
			releaseSession();
			setError(errorText(caught));
		} finally {
			setPending(false);
		}
	}
	async function onSignup(event) {
		event.preventDefault();
		if (password.length < 10) {
			setError("Utilisez au moins 10 caractères.");
			return;
		}
		if (password !== confirm) {
			setError("Les mots de passe ne correspondent pas.");
			return;
		}
		setPending(true);
		setError(null);
		try {
			holdSession();
			const user = await signUpEmail(email.trim(), password);
			const vault = await createVault(password);
			writeDemoIds(user.id, vault.demoIds);
			setDek(vault.dek);
			setPassword("");
			setConfirm("");
			setShownCode(vault.recoveryCode);
		} catch (caught) {
			releaseSession();
			setError(errorText(caught));
		} finally {
			setPending(false);
		}
	}
	async function onForgot(event) {
		event.preventDefault();
		if (password.length < 10) {
			setError("Le nouveau mot de passe doit contenir au moins 10 caractères.");
			return;
		}
		if (password !== confirm) {
			setError("Les mots de passe ne correspondent pas.");
			return;
		}
		setPending(true);
		setError(null);
		try {
			await resetWithRecovery(email.trim().toLowerCase(), recoveryCode, password);
			setPassword("");
			setConfirm("");
			setRecoveryCode("");
			const saved = readRememberedLogin();
			const normalized = email.trim().toLowerCase();
			if (saved?.email === normalized) writeRememberedLogin(normalized, password);
			setMode("login");
			setNotice("Mot de passe mis à jour. Vous pouvez vous connecter.");
		} catch (caught) {
			setError(errorText(caught));
		} finally {
			setPending(false);
		}
	}
	function continueAfterRecovery() {
		releaseSession();
		navigate({ to: "/" });
	}
	function downloadCode() {
		if (!shownCode) return;
		const text = [
			"Code de récupération — MELVAULT",
			`Adresse : ${email.trim()}`,
			"",
			shownCode,
			"",
			"Conservez ce fichier hors ligne.",
			"Il permet de choisir un nouveau mot de passe de connexion",
			"sans perdre l'accès aux comptes chiffrés.",
			"Ce fichier ne contient aucun mot de passe du coffre."
		].join("\n");
		const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "coffre-recuperation.txt";
		link.click();
		URL.revokeObjectURL(url);
	}
	async function copyCode() {
		if (!shownCode) return;
		try {
			await navigator.clipboard.writeText(shownCode);
			setError(null);
		} catch {
			setError("Copie impossible. Notez le code ou téléchargez le fichier.");
		}
	}
	if (shownCode) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { subtitle: "Code de récupération" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card mt-8 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Notez ce code maintenant. C'est le seul moyen de choisir un nouveau mot de passe si vous oubliez celui de connexion. Il n'est pas envoyé par e-mail, et personne d'autre ne peut le lire."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "secret rounded-control bg-surface-2 px-3 py-3 text-center text-base",
					children: shownCode
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-secondary",
						onClick: () => void copyCode(),
						children: "Copier"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-secondary",
						onClick: downloadCode,
						children: "Télécharger"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Vous pourrez le réafficher plus tard dans Réglages, une fois le coffre déverrouillé."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-start gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "mt-1",
						checked: kept,
						onChange: (event) => setKept(event.target.checked)
					}), "J'ai conservé ce code hors de cet appareil."]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-primary w-full",
					disabled: !kept,
					onClick: continueAfterRecovery,
					children: "Ouvrir le coffre"
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
				large: true,
				subtitle: "Vos mots de passe restent chiffrés sur cet appareil."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "chip",
					"aria-pressed": mode === "login",
					onClick: () => switchMode("login"),
					children: "Connexion"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": mode === "signup",
					className: "chip",
					onClick: () => switchMode("signup"),
					children: "Créer un coffre"
				})]
			}),
			mode === "forgot" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 space-y-4",
				onSubmit: (event) => void onForgot(event),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Saisissez le code de récupération remis à la création du coffre, puis un nouveau mot de passe. Sans ce code, les comptes déjà enregistrés ne peuvent pas être relus."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Adresse e-mail",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							type: "email",
							autoComplete: "username",
							required: true,
							value: email,
							onChange: (event) => setEmail(event.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Code de récupération",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field secret",
							autoComplete: "off",
							spellCheck: false,
							required: true,
							value: recoveryCode,
							onChange: (event) => setRecoveryCode(event.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
						label: "Nouveau mot de passe",
						value: password,
						onChange: setPassword,
						autoComplete: "new-password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
						label: "Confirmer",
						value: confirm,
						onChange: setConfirm,
						autoComplete: "new-password"
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary w-full",
						type: "submit",
						disabled: pending,
						children: pending ? "Vérification…" : "Réinitialiser"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm text-muted underline-offset-2 hover:underline",
						onClick: () => switchMode("login"),
						children: "Retour à la connexion"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 space-y-4",
				onSubmit: (event) => void (mode === "login" ? onLogin(event) : onSignup(event)),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Adresse e-mail",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							type: "email",
							autoComplete: "username",
							required: true,
							value: email,
							onChange: (event) => setEmail(event.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
						label: "Mot de passe",
						value: password,
						onChange: setPassword,
						autoComplete: mode === "login" ? "current-password" : "new-password"
					}),
					mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password }) : null,
					mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
						label: "Confirmer le mot de passe",
						value: confirm,
						onChange: setConfirm,
						autoComplete: "new-password"
					}) : null,
					mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "10 caractères minimum. Ce mot de passe déverrouille le chiffrement."
					}) : null,
					mode === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "mt-1",
							checked: remember,
							onChange: (event) => {
								const on = event.target.checked;
								setRemember(on);
								if (!on) clearRememberedLogin();
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Mémoriser le mot de passe de connexion", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-muted",
							children: "À vos risques et périls. Il reste sur cet appareil et peut être lu par quelqu'un qui l'utilise."
						})] })]
					}) : null,
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-control bg-surface-2 px-3 py-2 text-sm",
						children: notice
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary w-full",
						type: "submit",
						disabled: pending,
						children: pending ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer le coffre"
					}),
					mode === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-sm text-muted underline-offset-2 hover:underline",
							onClick: () => switchMode("forgot"),
							children: "Mot de passe oublié"
						}), userCount === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-right text-sm text-muted tabular-nums",
							children: userCount === 1 ? "1 utilisateur" : `${userCount} utilisateurs`
						})]
					}) : null
				]
			})
		]
	});
}
function Login() {
	const { user, isPending } = useCurrentUserState();
	const hold = (0, import_react.useRef)(false);
	if (!hold.current && isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton, {});
	if (!hold.current && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthScreen, {
		holdSession: () => {
			hold.current = true;
		},
		releaseSession: () => {
			hold.current = false;
		}
	});
}
//#endregion
export { Login as component };

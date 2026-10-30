import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, b as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as compteLabel, f as openAccount, g as sealAccount, p as parsePack, s as decryptJson } from "./recovery-C7QWzwNy.mjs";
import { r as signOut } from "./client-CH2mWUg4.mjs";
import { S as Briefcase, a as ShoppingBag, b as Clapperboard, c as Plus, d as Landmark, f as HeartPulse, h as Gamepad2, i as Smartphone, l as Mail, m as Globe, n as TrainFront, o as Settings, p as GraduationCap, r as Tag, s as Search, u as LogOut, v as Copy, x as ChevronDown, y as Cog } from "../_libs/lucide-react.mjs";
import { A as savePasswordWrap, B as writeLockMinutes, C as readCategoryCatalog, E as readRememberedLogin, F as unlockVault, I as upsertItem, L as useCurrentUserState, O as rewrapWithPassword, P as subscribeUnlock, R as writeCategoryCatalog, S as listItems, T as readLockMinutes, _ as generatePassword, a as Mark, b as importVault, c as StrengthMeter, g as exportVault, h as errorText, i as Field, j as setDek, k as rotateRememberedPassword, l as changeLoginPassword, m as deleteItems, n as Brand, o as PageSkeleton, p as createVault, r as Dialog, s as SecretField, t as Alert, u as clearDemoIds, v as getDek, w as readDemoIds, x as insertItems, y as getMeta, z as writeDemoIds } from "./actions-mbg_4kgT.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DC8xL1-g.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
var EMPTY = {
	service: "",
	category: "internet",
	username: "",
	email: "",
	password: "",
	phone: "",
	notes: ""
};
function AccountDialog({ initial, title, pending, categories, onClose, onSave }) {
	const [fields, setFields] = (0, import_react.useState)(initial ?? EMPTY);
	const [error, setError] = (0, import_react.useState)(null);
	const [generator, setGenerator] = (0, import_react.useState)(false);
	const [options, setOptions] = (0, import_react.useState)({
		length: 20,
		upper: true,
		lower: true,
		digits: true,
		symbols: true
	});
	const [generated, setGenerated] = (0, import_react.useState)("");
	function patch(partial) {
		setFields((current) => ({
			...current,
			...partial
		}));
	}
	function onSubmit(event) {
		event.preventDefault();
		if (!fields.service.trim()) {
			setError("Indiquez le nom du service.");
			return;
		}
		const category = categories.some((entry) => entry.id === fields.category) ? fields.category : categories[0]?.id ?? "internet";
		onSave({
			...fields,
			service: fields.service.trim(),
			category
		});
	}
	function makePassword() {
		try {
			setGenerated(generatePassword(options));
			setError(null);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Génération impossible.");
		}
	}
	const choices = fields.category && !categories.some((entry) => entry.id === fields.category) ? [{
		id: fields.category,
		label: fields.category
	}, ...categories] : categories;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		title,
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-4",
			onSubmit,
			autoComplete: "off",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-quiet",
						onClick: onClose,
						children: "Fermer"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Nom du service",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: fields.service,
						required: true,
						autoComplete: "off",
						spellCheck: false,
						onChange: (event) => patch({ service: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Catégorie",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field",
						value: fields.category,
						onChange: (event) => patch({ category: event.target.value }),
						children: choices.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: category.id,
							children: category.label
						}, category.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Identifiant",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: fields.username,
						autoComplete: "off",
						spellCheck: false,
						autoCapitalize: "off",
						onChange: (event) => patch({ username: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Adresse e-mail",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						type: "email",
						value: fields.email,
						autoComplete: "off",
						spellCheck: false,
						onChange: (event) => patch({ email: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
					label: "Mot de passe",
					value: fields.password,
					autoComplete: "new-password",
					onChange: (password) => patch({ password })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password: fields.password }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-quiet",
					onClick: () => setGenerator((open) => !open),
					children: generator ? "Fermer le générateur" : "Générer un mot de passe"
				}),
				generator ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 rounded-control border border-line bg-surface-2 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: `Longueur : ${options.length}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "w-full",
								type: "range",
								min: 12,
								max: 48,
								value: options.length,
								onChange: (event) => setOptions((current) => ({
									...current,
									length: Number(event.target.value)
								}))
							})
						}),
						[
							["upper", "Majuscules"],
							["lower", "Minuscules"],
							["digits", "Chiffres"],
							["symbols", "Caractères spéciaux"]
						].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: options[key],
								onChange: (event) => setOptions((current) => ({
									...current,
									[key]: event.target.checked
								}))
							}), label]
						}, key)),
						generated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password: generated }) : null,
						generated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "secret break-all rounded-control bg-surface px-3 py-2 text-sm",
							children: generated
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-secondary",
									onClick: makePassword,
									children: "Générer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-secondary",
									disabled: !generated,
									onClick: () => {
										if (!generated) return;
										navigator.clipboard.writeText(generated).then(() => setError(null), () => setError("Copie impossible."));
									},
									children: "Copier"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-secondary",
									disabled: !generated,
									onClick: () => {
										if (!generated) return;
										patch({ password: generated });
										setGenerator(false);
									},
									children: "Utiliser ce mot de passe"
								})
							]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Téléphone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: fields.phone,
						autoComplete: "off",
						spellCheck: false,
						onChange: (event) => patch({ phone: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Notes",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "field",
						value: fields.notes,
						spellCheck: false,
						onChange: (event) => patch({ notes: event.target.value })
					})
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "btn btn-primary w-full",
					disabled: pending,
					children: pending ? "Enregistrement…" : "Enregistrer"
				})
			]
		})
	});
}
function SettingsDialog({ dek, meta, items, lockMinutes, onLockMinutes, onLockNow, onClose, onImported, onPasswordWrap }) {
	const [currentPassword, setCurrentPassword] = (0, import_react.useState)("");
	const [nextPassword, setNextPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [pendingPassword, setPendingPassword] = (0, import_react.useState)(false);
	const [pendingWrap, setPendingWrap] = (0, import_react.useState)(null);
	const [passwordError, setPasswordError] = (0, import_react.useState)(null);
	const [code, setCode] = (0, import_react.useState)(null);
	const [exportPass, setExportPass] = (0, import_react.useState)("");
	const [exportConfirm, setExportConfirm] = (0, import_react.useState)("");
	const [importPass, setImportPass] = (0, import_react.useState)("");
	const [importFile, setImportFile] = (0, import_react.useState)(null);
	const [importName, setImportName] = (0, import_react.useState)("");
	const [transferError, setTransferError] = (0, import_react.useState)(null);
	const [pendingTransfer, setPendingTransfer] = (0, import_react.useState)(false);
	async function revealCode() {
		try {
			const parsed = await decryptJson(dek, parsePack(meta.recoveryHint));
			if (!parsed.code) throw new Error("Code illisible");
			setCode(parsed.code);
		} catch {
			toast("Code de récupération illisible");
		}
	}
	async function onChangePassword(event) {
		event.preventDefault();
		if (!pendingWrap) {
			if (nextPassword.length < 10) {
				setPasswordError("10 caractères minimum.");
				return;
			}
			if (nextPassword !== confirm) {
				setPasswordError("Les mots de passe ne correspondent pas.");
				return;
			}
		}
		setPendingPassword(true);
		setPasswordError(null);
		try {
			if (pendingWrap) {
				await savePasswordWrap(pendingWrap);
				onPasswordWrap(pendingWrap);
				setPendingWrap(null);
				toast("Chiffrement mis à jour");
				return;
			}
			await unlockVault(currentPassword, meta);
			const wrapped = await rewrapWithPassword(dek, meta, nextPassword);
			await changeLoginPassword(currentPassword, nextPassword);
			try {
				await savePasswordWrap(wrapped);
				onPasswordWrap(wrapped);
			} catch (caught) {
				setPendingWrap(wrapped);
				setPasswordError(`${errorText(caught)} Le mot de passe de connexion a changé. Relancez pour enregistrer le chiffrement.`);
				return;
			}
			setCurrentPassword("");
			setNextPassword("");
			setConfirm("");
			rotateRememberedPassword(currentPassword, nextPassword);
			toast("Mot de passe de connexion mis à jour");
		} catch (caught) {
			setPasswordError(errorText(caught));
		} finally {
			setPendingPassword(false);
		}
	}
	async function onExport(event) {
		event.preventDefault();
		if (exportPass.length < 10) {
			setTransferError("Choisissez une phrase secrète d'au moins 10 caractères.");
			return;
		}
		if (exportPass !== exportConfirm) {
			setTransferError("Les phrases secrètes ne correspondent pas.");
			return;
		}
		setPendingTransfer(true);
		setTransferError(null);
		try {
			const file = await exportVault(items.map(({ service, category, username, email, password, phone, notes }) => ({
				service,
				category,
				username,
				email,
				password,
				phone,
				notes
			})), exportPass);
			const blob = new Blob([file], { type: "application/octet-stream" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "coffre.vault";
			link.click();
			URL.revokeObjectURL(url);
			setExportPass("");
			setExportConfirm("");
			toast("Coffre chiffré téléchargé");
		} catch (caught) {
			setTransferError(errorText(caught));
		} finally {
			setPendingTransfer(false);
		}
	}
	async function onImport(event) {
		event.preventDefault();
		if (!importFile) {
			setTransferError("Choisissez un fichier .vault.");
			return;
		}
		setPendingTransfer(true);
		setTransferError(null);
		try {
			const accounts = await importVault(importFile, importPass);
			if (accounts.length === 0) throw new Error("Aucun compte dans ce fichier.");
			const sealed = [];
			for (const account of accounts) {
				const row = await sealAccount(dek, account);
				sealed.push({
					...row,
					hasPassword: account.password.trim().length > 0
				});
			}
			await insertItems({ data: { items: sealed } });
			const added = sealed.map((row, index) => ({
				id: row.id,
				...accounts[index]
			}));
			onImported(added);
			setImportPass("");
			setImportFile(null);
			setImportName("");
			toast(`${added.length} compte${added.length > 1 ? "s" : ""} importé${added.length > 1 ? "s" : ""}`);
		} catch (caught) {
			setTransferError(errorText(caught));
		} finally {
			setPendingTransfer(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		title: "Réglages",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: "Réglages"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-quiet",
						onClick: onClose,
						children: "Fermer"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium",
							children: "Verrouillage automatique"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted",
							children: ["Après inactivité", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field mt-1.5",
								value: lockMinutes,
								onChange: (event) => onLockMinutes(Number(event.target.value)),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 1,
										children: "1 minute"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 5,
										children: "5 minutes"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 15,
										children: "15 minutes"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 30,
										children: "30 minutes"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: onLockNow,
							children: "Verrouiller maintenant"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 border-t border-line pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-medium",
						children: "Mot de passe de connexion"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3",
						onSubmit: (event) => void onChangePassword(event),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
								label: "Mot de passe actuel",
								value: currentPassword,
								onChange: setCurrentPassword,
								autoComplete: "current-password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
								label: "Nouveau mot de passe",
								value: nextPassword,
								onChange: setNextPassword,
								autoComplete: "new-password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrengthMeter, { password: nextPassword }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
								label: "Confirmer",
								value: confirm,
								onChange: setConfirm,
								autoComplete: "new-password"
							}),
							passwordError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: passwordError }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn btn-primary",
								disabled: pendingPassword,
								children: pendingPassword ? "Mise à jour…" : pendingWrap ? "Réenregistrer le chiffrement" : "Changer le mot de passe"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 border-t border-line pt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium",
							children: "Code de récupération"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Il ne change pas quand vous modifiez le mot de passe de connexion."
						}),
						code ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "secret rounded-control bg-surface-2 px-3 py-3",
							children: code
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								onClick: () => void revealCode(),
								children: code ? "Réafficher" : "Afficher"
							}), code ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								onClick: () => {
									navigator.clipboard.writeText(code).then(() => toast("Code copié"), () => toast("Copie impossible"));
								},
								children: "Copier"
							}) : null]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 border-t border-line pt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium",
							children: "Exporter"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Le fichier est chiffré. Il ne contient pas les mots de passe en clair. Choisissez une phrase secrète pour l'ouvrir plus tard."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "space-y-3",
							onSubmit: (event) => void onExport(event),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
									label: "Phrase secrète",
									value: exportPass,
									onChange: setExportPass,
									autoComplete: "new-password"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
									label: "Confirmer",
									value: exportConfirm,
									onChange: setExportConfirm,
									autoComplete: "new-password"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn btn-secondary",
									disabled: pendingTransfer,
									children: "Télécharger le coffre chiffré"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 border-t border-line pt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium",
							children: "Importer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Les comptes importés sont ajoutés tels quels. Deux fiches du même service restent distinctes."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "space-y-3",
							onSubmit: (event) => void onImport(event),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "btn btn-secondary cursor-pointer",
									children: [importName || "Choisir un fichier", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "sr-only",
										type: "file",
										accept: ".vault,application/json,application/octet-stream",
										onChange: (event) => {
											const file = event.target.files?.[0];
											if (!file) return;
											if (file.size > 2e6) {
												setTransferError("Fichier trop volumineux.");
												return;
											}
											setImportName(file.name);
											file.text().then(setImportFile);
										}
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
									label: "Phrase secrète du fichier",
									value: importPass,
									onChange: setImportPass,
									autoComplete: "current-password"
								}),
								transferError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: transferError }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn btn-primary",
									disabled: pendingTransfer,
									children: pendingTransfer ? "Import…" : "Importer"
								})
							]
						})
					]
				})
			]
		})
	});
}
var BUILTIN = [
	{
		id: "mail",
		label: "Mail",
		icon: Mail
	},
	{
		id: "telephony",
		label: "Téléphonie",
		icon: Smartphone
	},
	{
		id: "internet",
		label: "Internet",
		icon: Globe
	},
	{
		id: "official",
		label: "Démarches officielles",
		icon: Landmark
	},
	{
		id: "school",
		label: "Scolaire",
		icon: GraduationCap
	},
	{
		id: "entertainment",
		label: "Divertissement",
		icon: Clapperboard
	},
	{
		id: "games",
		label: "Jeux vidéo",
		icon: Gamepad2
	},
	{
		id: "delivery",
		label: "Travail",
		icon: Briefcase
	},
	{
		id: "shopping",
		label: "Achat/Magasin",
		icon: ShoppingBag
	},
	{
		id: "health",
		label: "Santé",
		icon: HeartPulse
	},
	{
		id: "travel",
		label: "Transport",
		icon: TrainFront
	}
];
new Map(BUILTIN.map((entry) => [entry.id, entry.icon]));
function slugifyCategory(label) {
	return label.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function resolveCategories(catalog, usedIds = []) {
	const removed = new Set(catalog.removed);
	const list = BUILTIN.filter((entry) => !removed.has(entry.id));
	const known = new Set(list.map((entry) => entry.id));
	for (const entry of catalog.added) {
		if (removed.has(entry.id) || known.has(entry.id)) continue;
		known.add(entry.id);
		list.push({
			id: entry.id,
			label: entry.label,
			icon: Tag
		});
	}
	for (const id of usedIds) {
		if (!id || known.has(id) || removed.has(id)) continue;
		known.add(id);
		list.push({
			id,
			label: id,
			icon: Tag
		});
	}
	return list;
}
function fold(value) {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function matchesQuery(item, query, labels = []) {
	const needle = fold(query.trim());
	if (!needle) return true;
	const category = labels.find((entry) => entry.id === item.category)?.label ?? "";
	return [
		item.service,
		item.username,
		item.email,
		category,
		item.notes
	].map(fold).join("\n").includes(needle);
}
function countByCategory(items, ids) {
	const counts = Object.fromEntries(ids.map((id) => [id, 0]));
	for (const item of items) if (item.category in counts) counts[item.category] += 1;
	return counts;
}
var MASK = "••••••••••••";
function filled(value) {
	return value.trim().length > 0;
}
async function copyValue(value, label) {
	if (!value) {
		toast("Rien à copier");
		return;
	}
	try {
		await navigator.clipboard.writeText(value);
		toast(label);
	} catch {
		toast("Copie impossible dans ce navigateur");
	}
}
function VaultScreen({ userId, email }) {
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [tick, setTick] = (0, import_react.useState)(0);
	const [meta, setMeta] = (0, import_react.useState)(null);
	const [metaReady, setMetaReady] = (0, import_react.useState)(false);
	const [items, setItems] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [suggestOpen, setSuggestOpen] = (0, import_react.useState)(false);
	const [category, setCategory] = (0, import_react.useState)("all");
	const [catalog, setCatalog] = (0, import_react.useState)({
		removed: [],
		added: []
	});
	const [catalogOpen, setCatalogOpen] = (0, import_react.useState)(false);
	const [categoryName, setCategoryName] = (0, import_react.useState)("");
	const [categoryBusy, setCategoryBusy] = (0, import_react.useState)(false);
	const [revealed, setRevealed] = (0, import_react.useState)({});
	const [openIds, setOpenIds] = (0, import_react.useState)({});
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [lockMinutes, setLockMinutes] = (0, import_react.useState)(5);
	const [unlockPassword, setUnlockPassword] = (0, import_react.useState)("");
	const [unlockError, setUnlockError] = (0, import_react.useState)(null);
	const [unlocking, setUnlocking] = (0, import_react.useState)(false);
	const [setupPassword, setSetupPassword] = (0, import_react.useState)("");
	const [freshCode, setFreshCode] = (0, import_react.useState)(null);
	const [keptCode, setKeptCode] = (0, import_react.useState)(false);
	const [demoIds, setDemoIds] = (0, import_react.useState)([]);
	const [hideDemoNote, setHideDemoNote] = (0, import_react.useState)(false);
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		setLockMinutes(readLockMinutes());
		setDemoIds(readDemoIds(userId));
		setCatalog(readCategoryCatalog(userId));
		const saved = readRememberedLogin();
		if (saved && email && saved.email === email.trim().toLowerCase()) setUnlockPassword(saved.password);
		return subscribeUnlock(() => setTick((value) => value + 1));
	}, [userId, email]);
	const dek = mounted ? getDek() : null;
	const lock = (0, import_react.useCallback)(() => {
		setDek(null);
		setItems(null);
		setRevealed({});
		setEditing(null);
		setSettingsOpen(false);
		setConfirmId(null);
		const saved = readRememberedLogin();
		const remembered = saved && email && saved.email === email.trim().toLowerCase() ? saved.password : "";
		setUnlockPassword(remembered);
	}, [email]);
	(0, import_react.useEffect)(() => {
		if (!mounted || dek) return;
		let cancel = false;
		setMetaReady(false);
		getMeta().then((value) => {
			if (cancel) return;
			setMeta(value);
			setMetaReady(true);
		}).catch((caught) => {
			if (cancel) return;
			setLoadError(errorText(caught));
			setMetaReady(true);
		});
		return () => {
			cancel = true;
		};
	}, [mounted, dek]);
	(0, import_react.useEffect)(() => {
		if (!dek) return;
		let cancel = false;
		(async () => {
			try {
				const rows = await listItems();
				const next = [];
				for (const row of rows) try {
					const fields = await openAccount(dek, row.iv, row.ciphertext);
					next.push({
						id: row.id,
						...fields
					});
				} catch {}
				if (!cancel) {
					setItems(next);
					setLoadError(null);
				}
			} catch (caught) {
				if (!cancel) setLoadError(errorText(caught));
			}
		})();
		return () => {
			cancel = true;
		};
	}, [dek]);
	(0, import_react.useEffect)(() => {
		if (!dek) return;
		let last = Date.now();
		const mark = () => {
			last = Date.now();
		};
		const events = [
			"pointerdown",
			"keydown",
			"touchstart"
		];
		events.forEach((event) => window.addEventListener(event, mark, { passive: true }));
		const timer = window.setInterval(() => {
			if (Date.now() - last >= lockMinutes * 6e4) lock();
		}, 5e3);
		const onHide = () => {
			if (document.visibilityState === "visible" && Date.now() - last >= lockMinutes * 6e4) lock();
		};
		document.addEventListener("visibilitychange", onHide);
		return () => {
			events.forEach((event) => window.removeEventListener(event, mark));
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onHide);
		};
	}, [
		dek,
		lock,
		lockMinutes
	]);
	const categories = (0, import_react.useMemo)(() => resolveCategories(catalog, (items ?? []).map((item) => item.category)), [catalog, items]);
	const counts = (0, import_react.useMemo)(() => countByCategory(items ?? [], categories.map((entry) => entry.id)), [items, categories]);
	const visible = (0, import_react.useMemo)(() => {
		return (items ?? []).filter((item) => {
			if (category !== "all" && item.category !== category) return false;
			return matchesQuery(item, query, categories);
		});
	}, [
		items,
		category,
		query,
		categories
	]);
	const suggestions = (0, import_react.useMemo)(() => {
		const needle = query.trim();
		if (needle.length < 2) return [];
		const seen = /* @__PURE__ */ new Set();
		const list = [];
		for (const item of items ?? []) {
			if (!matchesQuery(item, needle)) continue;
			const service = item.service.trim();
			const extra = item.email.trim() || item.username.trim();
			const label = service && extra && extra.toLowerCase() !== service.toLowerCase() ? `${service} · ${extra}` : service || extra;
			const key = label.toLowerCase();
			if (!label || seen.has(key)) continue;
			seen.add(key);
			list.push(label);
			if (list.length >= 6) break;
		}
		return list;
	}, [items, query]);
	const demoStillThere = demoIds.filter((id) => items?.some((item) => item.id === id));
	async function onUnlock(event) {
		event.preventDefault();
		if (!meta) return;
		setUnlocking(true);
		setUnlockError(null);
		try {
			const next = await unlockVault(unlockPassword, meta);
			setUnlockPassword("");
			setDek(next);
		} catch (caught) {
			setUnlockError(errorText(caught));
		} finally {
			setUnlocking(false);
		}
	}
	async function onSetup(event) {
		event.preventDefault();
		if (setupPassword.length < 10) {
			setUnlockError("10 caractères minimum.");
			return;
		}
		setUnlocking(true);
		setUnlockError(null);
		try {
			const vault = await createVault(setupPassword);
			writeDemoIds(userId, vault.demoIds);
			setDemoIds(vault.demoIds);
			setSetupPassword("");
			setDek(vault.dek);
			setFreshCode(vault.recoveryCode);
			setMeta(await getMeta());
		} catch (caught) {
			setUnlockError(errorText(caught));
		} finally {
			setUnlocking(false);
		}
	}
	async function onSave(fields) {
		if (!dek) return;
		setSaving(true);
		try {
			const existingId = editing && editing !== "new" ? editing.id : crypto.randomUUID();
			const sealed = await sealAccount(dek, fields);
			const row = {
				id: existingId,
				iv: sealed.iv,
				ciphertext: sealed.ciphertext,
				hasPassword: fields.password.trim().length > 0
			};
			await upsertItem({ data: row });
			const saved = {
				id: existingId,
				...fields
			};
			setItems((current) => {
				const list = current ?? [];
				if (list.findIndex((item) => item.id === existingId) === -1) return [...list, saved];
				return list.map((item) => item.id === existingId ? saved : item);
			});
			setEditing(null);
			toast("Compte enregistré");
		} catch (caught) {
			toast(errorText(caught));
		} finally {
			setSaving(false);
		}
	}
	async function onDelete(id) {
		try {
			await deleteItems({ data: { ids: [id] } });
			setItems((current) => (current ?? []).filter((item) => item.id !== id));
			setConfirmId(null);
			toast("Compte supprimé");
		} catch (caught) {
			toast(errorText(caught));
		}
	}
	async function removeDemos() {
		if (demoStillThere.length === 0) return;
		try {
			await deleteItems({ data: { ids: demoStillThere } });
			setItems((current) => (current ?? []).filter((item) => !demoStillThere.includes(item.id)));
			clearDemoIds(userId);
			setDemoIds([]);
			toast("Exemples retirés");
		} catch (caught) {
			toast(errorText(caught));
		}
	}
	function persistCatalog(next) {
		setCatalog(next);
		writeCategoryCatalog(userId, next);
	}
	function addCategory(event) {
		event.preventDefault();
		const label = categoryName.trim().slice(0, 32);
		const id = slugifyCategory(label);
		if (!label || !id) {
			toast("Indiquez un nom de catégorie.");
			return;
		}
		if (categories.some((entry) => entry.id === id || entry.label.toLowerCase() === label.toLowerCase())) {
			toast("Cette catégorie existe déjà.");
			return;
		}
		persistCatalog({
			removed: catalog.removed.filter((entry) => entry !== id),
			added: resolveCategories({
				removed: [],
				added: []
			}).some((entry) => entry.id === id) ? catalog.added : [...catalog.added.filter((entry) => entry.id !== id), {
				id,
				label
			}]
		});
		setCategoryName("");
		setCategory(id);
	}
	async function removeCategory(id) {
		const nextCategories = categories.filter((entry) => entry.id !== id);
		if (nextCategories.length === 0) {
			toast("Gardez au moins une catégorie.");
			return;
		}
		const fallback = nextCategories.find((entry) => entry.id === "internet")?.id ?? nextCategories[0]?.id;
		if (!fallback || !dek) return;
		const affected = (items ?? []).filter((item) => item.category === id);
		setCategoryBusy(true);
		try {
			for (const item of affected) {
				const fields = {
					service: item.service,
					category: fallback,
					username: item.username,
					email: item.email,
					password: item.password,
					phone: item.phone,
					notes: item.notes
				};
				const sealed = await sealAccount(dek, fields);
				await upsertItem({ data: {
					id: item.id,
					iv: sealed.iv,
					ciphertext: sealed.ciphertext,
					hasPassword: fields.password.trim().length > 0
				} });
			}
			if (affected.length > 0) setItems((current) => (current ?? []).map((item) => item.category === id ? {
				...item,
				category: fallback
			} : item));
			persistCatalog({
				removed: catalog.removed.includes(id) ? catalog.removed : [...catalog.removed, id],
				added: catalog.added.filter((entry) => entry.id !== id)
			});
			if (category === id) setCategory("all");
			toast(affected.length > 0 ? "Catégorie retirée, comptes déplacés." : "Catégorie retirée");
		} catch (caught) {
			toast(errorText(caught));
		} finally {
			setCategoryBusy(false);
		}
	}
	async function onSignOut() {
		setSigningOut(true);
		lock();
		try {
			await signOut("/login");
		} catch {
			setSigningOut(false);
			toast("La déconnexion n'a pas abouti. Réessayez.");
		}
	}
	if (!mounted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton, {});
	if (!dek) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, { subtitle: email ?? "Coffre verrouillé" }), !metaReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-sm text-muted",
			children: "Ouverture de la session…"
		}) : meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-8 space-y-4",
			onSubmit: (event) => void onUnlock(event),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Le coffre est verrouillé. Saisissez votre mot de passe pour déchiffrer vos comptes sur cet appareil."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
					label: "Mot de passe",
					value: unlockPassword,
					onChange: setUnlockPassword,
					autoComplete: "current-password"
				}),
				unlockError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: unlockError }) : null,
				loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: loadError }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "btn btn-primary w-full",
					disabled: unlocking,
					children: unlocking ? "Déchiffrement…" : "Déverrouiller"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-secondary w-full",
					disabled: signingOut,
					onClick: () => void onSignOut(),
					children: signingOut ? "Déconnexion…" : "Déconnexion"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-8 space-y-4",
			onSubmit: (event) => void onSetup(event),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Ce compte n'a pas encore de coffre chiffré. Confirmez le mot de passe de connexion pour le créer."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretField, {
					label: "Mot de passe",
					value: setupPassword,
					onChange: setSetupPassword,
					autoComplete: "current-password"
				}),
				unlockError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: unlockError }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "btn btn-primary w-full",
					disabled: unlocking,
					children: unlocking ? "Création…" : "Créer le chiffrement"
				})
			]
		})]
	});
	const confirmItem = items?.find((item) => item.id === confirmId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-4 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "z-10 -mx-4 border-b border-line bg-bg px-4 pb-3 pt-1 sm:sticky sm:top-0 sm:pb-4 sm:pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl tracking-tight sm:text-3xl",
								children: "MELVAULT"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 truncate text-sm text-muted tabular-nums",
								children: [items ? compteLabel(items.length) : "Chargement…", email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-subtle",
									children: [" · ", email]
								}) : null]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "action-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: () => setSettingsOpen(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
								size: 14,
								"aria-hidden": "true"
							}), "Réglages"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							disabled: signingOut,
							onClick: () => void onSignOut(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
								size: 14,
								"aria-hidden": "true"
							}), signingOut ? "…" : "Déconnexion/Verrouillage"]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle",
								size: 18,
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field field-search",
								type: "search",
								placeholder: "Rechercher un compte…",
								value: query,
								autoComplete: "off",
								spellCheck: false,
								"aria-label": "Rechercher un compte",
								"aria-expanded": suggestOpen && suggestions.length > 0,
								"aria-autocomplete": "list",
								onChange: (event) => {
									setQuery(event.target.value);
									setSuggestOpen(true);
								},
								onFocus: () => setSuggestOpen(true),
								onBlur: () => setSuggestOpen(false)
							}),
							suggestOpen && suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "suggest",
								role: "listbox",
								children: suggestions.map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "option",
									onPointerDown: (event) => event.preventDefault(),
									onClick: () => {
										setQuery(label.split(" · ")[0] ?? label);
										setCategory("all");
										setSuggestOpen(false);
									},
									children: label
								}) }, label))
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => setEditing("new"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 18,
							"aria-hidden": "true"
						}), "Ajouter"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cat-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "chip chip-cat",
						"aria-pressed": category === "all",
						onClick: () => setCategory("all"),
						children: ["Tous", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: items?.length ?? 0
						})]
					}),
					categories.map((entry) => {
						const Icon = entry.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "chip chip-cat",
							"aria-pressed": category === entry.id,
							onClick: () => setCategory(entry.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									size: 14,
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 truncate",
									children: entry.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: counts[entry.id] ?? 0
								})
							]
						}, entry.id);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "chip chip-cat chip-wheel",
						"aria-pressed": catalogOpen,
						"aria-label": "Gérer les catégories",
						onClick: () => setCatalogOpen((open) => !open),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cog, {
							size: 15,
							"aria-hidden": "true"
						})
					})
				]
			}),
			catalogOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cat-editor",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Catégories"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: categories.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate",
								children: entry.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-quiet",
								disabled: categoryBusy,
								onClick: () => void removeCategory(entry.id),
								children: "Retirer"
							})]
						}, entry.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex gap-2",
						onSubmit: addCategory,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: categoryName,
							placeholder: "Nouvelle catégorie",
							maxLength: 32,
							"aria-label": "Nouvelle catégorie",
							onChange: (event) => setCategoryName(event.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "btn btn-primary shrink-0",
							disabled: categoryBusy,
							children: "Ajouter"
						})]
					})
				]
			}) : null,
			query.trim() || category !== "all" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted tabular-nums",
				"aria-live": "polite",
				children: [
					compteLabel(visible.length),
					" affiché",
					visible.length === 1 ? "" : "s"
				]
			}) : null,
			loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: loadError })
			}) : null,
			!hideDemoNote && demoStillThere.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Exemples fictifs pour essayer le coffre. Aucune donnée réelle. Vous pouvez les retirer d'un coup."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-quiet",
						onClick: () => void removeDemos(),
						children: "Retirer les exemples"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-quiet",
						onClick: () => setHideDemoNote(true),
						children: "Masquer"
					})]
				})]
			}) : null,
			items === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "card h-28 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "card h-28 animate-pulse" })]
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-center text-muted",
				children: items.length === 0 ? "Aucun compte pour le moment." : "Aucun compte ne correspond."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 space-y-6",
				children: categories.filter((entry) => category === "all" || category === entry.id).map((entry) => {
					const group = visible.filter((item) => item.category === entry.id);
					if (group.length === 0) return null;
					const Icon = entry.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mb-2 flex items-center gap-2 text-sm font-medium text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								size: 16,
								"aria-hidden": "true"
							}),
							entry.label,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: group.length
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1.5",
						children: group.map((item) => {
							const open = openIds[item.id] === true;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "overflow-hidden rounded-control border border-line bg-surface",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flex w-full items-center gap-2 px-3 py-1.5 text-left",
									"aria-expanded": open,
									onClick: () => setOpenIds((current) => ({
										...current,
										[item.id]: !current[item.id]
									})),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate text-sm font-medium",
										children: item.service
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
										size: 16,
										"aria-hidden": "true",
										className: `shrink-0 text-muted ${open ? "rotate-180" : ""}`
									})]
								}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t border-line px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "space-y-3",
										children: [
											filled(item.username) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLine, {
												label: "Identifiant",
												value: item.username,
												onCopy: () => void copyValue(item.username, "Identifiant copié")
											}) : null,
											filled(item.email) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLine, {
												label: "E-mail",
												value: item.email,
												onCopy: () => void copyValue(item.email, "E-mail copié")
											}) : null,
											filled(item.password) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-xs text-muted",
												children: "Mot de passe"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
												className: "mt-1 flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: revealed[item.id] ? "secret" : "tracking-widest text-muted",
														children: revealed[item.id] ? item.password : MASK
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "btn-quiet",
														onClick: () => setRevealed((current) => ({
															...current,
															[item.id]: !current[item.id]
														})),
														children: revealed[item.id] ? "Masquer" : "Afficher"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: "btn-quiet",
														onClick: () => void copyValue(item.password, "Mot de passe copié"),
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
															size: 14,
															"aria-hidden": "true"
														}), "Copier"]
													})
												]
											})] }) : null,
											filled(item.phone) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLine, {
												label: "Téléphone",
												value: item.phone,
												onCopy: () => void copyValue(item.phone, "Téléphone copié")
											}) : null,
											filled(item.notes) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
												className: "text-xs text-muted",
												children: "Notes"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
												className: "mt-1 text-sm whitespace-pre-wrap",
												children: item.notes
											})] }) : null
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn-quiet",
											onClick: () => setEditing(item),
											children: "Modifier"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn-quiet danger",
											onClick: () => setConfirmId(item.id),
											children: "Supprimer"
										})]
									})]
								}) : null]
							}, item.id);
						})
					})] }, entry.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-center text-xs text-subtle",
				children: "Chiffrement sur cet appareil. Le serveur ne stocke que des données illisibles."
			}),
			editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountDialog, {
				title: editing === "new" ? "Ajouter un compte" : "Modifier le compte",
				initial: editing === "new" ? null : editing,
				pending: saving,
				categories,
				onClose: () => setEditing(null),
				onSave: (fields) => void onSave(fields)
			}) : null,
			settingsOpen && meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsDialog, {
				dek,
				meta,
				items: items ?? [],
				lockMinutes,
				onLockMinutes: (minutes) => {
					setLockMinutes(minutes);
					writeLockMinutes(minutes);
				},
				onLockNow: lock,
				onClose: () => setSettingsOpen(false),
				onImported: (added) => setItems((current) => [...current ?? [], ...added]),
				onPasswordWrap: (dekPassword) => setMeta((current) => current ? {
					...current,
					dekPassword
				} : current)
			}) : null,
			confirmItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-root",
				onMouseDown: () => setConfirmId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "Supprimer le compte",
					className: "modal-panel",
					onMouseDown: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-2xl tracking-tight",
							children: [
								"Supprimer ",
								confirmItem.service,
								" ?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Cette fiche sera retirée du coffre. Les autres comptes du même service restent."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-wrap justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								onClick: () => setConfirmId(null),
								children: "Annuler"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-danger",
								onClick: () => void onDelete(confirmItem.id),
								children: "Supprimer"
							})]
						})
					]
				})
			}) : null,
			freshCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-root",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "Code de récupération",
					className: "modal-panel space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl tracking-tight",
							children: "Code de récupération"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Conservez-le hors ligne. Il permet de retrouver le coffre si vous oubliez le mot de passe."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "secret rounded-control bg-surface-2 px-3 py-3 text-center",
							children: freshCode
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "mt-1",
								checked: keptCode,
								onChange: (event) => setKeptCode(event.target.checked)
							}), "J'ai noté ce code."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-primary w-full",
							disabled: !keptCode,
							onClick: () => setFreshCode(null),
							children: "Continuer"
						})
					]
				})
			}) : null
		]
	});
}
function FieldLine({ label, value, onCopy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
		className: "mt-1 flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "secret text-sm",
			children: value || "—"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "btn-quiet",
			onClick: onCopy,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
				size: 14,
				"aria-hidden": "true"
			}), "Copier"]
		})]
	})] });
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultScreen, {
		userId: user.id,
		email: user.primaryEmail
	});
}
//#endregion
export { Home as component };

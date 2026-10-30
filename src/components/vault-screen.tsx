import { ChevronDown, Copy, Home, Mic, Moon, Plus, Power, Search, Settings, Sun, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth/client";
import { AccountDialog } from "@/components/account-dialog";
import { DocumentsScreen } from "@/components/documents-screen";
import { SettingsDialog } from "@/components/settings-dialog";
import { Alert, Brand, Mark, PageSkeleton, SecretField } from "@/components/ui";
import { createVault, errorText, unlockVault } from "@/lib/vault/actions";
import { readBiometricLogin, verifyBiometric } from "@/lib/vault/biometric";
import { deleteItems, getMeta, listItems, upsertItem, type VaultMeta } from "@/lib/vault/api";
import { resolveCategories, slugifyCategory, type CategoryCatalog } from "@/lib/vault/categories";
import { decryptJson, openAccount, sealAccount } from "@/lib/vault/crypto";
import { isVaultDocument, type StoredDocument } from "@/lib/vault/documents";
import {
  clearDemoIds,
  getDek,
  readCategoryCatalog,
  readDemoIds,
  readLockMinutes,
  readRememberedLogin,
  setDek,
  subscribeUnlock,
  writeDemoIds,
  writeLockMinutes,
  writeCategoryCatalog,
} from "@/lib/vault/memory";
import { matchesQuery } from "@/lib/vault/search";
import { applyTheme, readTheme, type ThemeName } from "@/lib/theme";
import { compteLabel, type AccountFields, type VaultItem } from "@/lib/vault/types";

const MASK = "••••••••••••";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function filled(value: string): boolean {
  return value.trim().length > 0;
}

async function copyValue(value: string, label: string) {
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

export function VaultScreen({ userId, email }: { userId: string; email: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [meta, setMeta] = useState<VaultMeta | null>(null);
  const [metaReady, setMetaReady] = useState(false);
  const [items, setItems] = useState<VaultItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const speechRef = useRef<SpeechRec | null>(null);
  const [category, setCategory] = useState<string | "all">("all");
  const [catalog, setCatalog] = useState<CategoryCatalog>({ removed: [], added: [] });
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<VaultItem | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(5);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [setupPassword, setSetupPassword] = useState("");
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [keptCode, setKeptCode] = useState(false);
  const [demoIds, setDemoIds] = useState<string[]>([]);
  const [hideDemoNote, setHideDemoNote] = useState(false);
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!settingsOpen) {
      delete document.documentElement.dataset.vaultOverlay;
      return;
    }
    document.documentElement.dataset.vaultOverlay = "settings";
    return () => {
      delete document.documentElement.dataset.vaultOverlay;
    };
  }, [settingsOpen]);

  useEffect(() => {
    setMounted(true);
    setLockMinutes(readLockMinutes());
    setDemoIds(readDemoIds(userId));
    setCatalog(readCategoryCatalog(userId));
    const saved = readRememberedLogin();
    if (saved && email && saved.email === email.trim().toLowerCase()) {
      setUnlockPassword(saved.password);
    }
    return subscribeUnlock(() => setTick((value) => value + 1));
  }, [userId, email]);

  const dek = mounted ? getDek() : null;
  void tick;

  useEffect(() => {
    if (!dek) return;
    document.documentElement.dataset.vaultDash = "1";
    return () => {
      delete document.documentElement.dataset.vaultDash;
    };
  }, [dek]);

  const lock = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = null;
    setListening(false);
    setDek(null);
    setItems(null);
    setRevealed({});
    setEditing(null);
    setSettingsOpen(false);
    setConfirmId(null);
    const saved = readRememberedLogin();
    const remembered =
      saved && email && saved.email === email.trim().toLowerCase() ? saved.password : "";
    setUnlockPassword(remembered);
  }, [email]);

  useEffect(() => {
    if (!mounted || dek) return;
    let cancel = false;
    setMetaReady(false);
    void getMeta()
      .then((value) => {
        if (cancel) return;
        setMeta(value);
        setMetaReady(true);
      })
      .catch((caught) => {
        if (cancel) return;
        setLoadError(errorText(caught));
        setMetaReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [mounted, dek]);

  useEffect(() => {
    if (!dek) return;
    let cancel = false;
    void (async () => {
      try {
        const rows = await listItems();
        const next: VaultItem[] = [];
        const documents: StoredDocument[] = [];
        for (const row of rows) {
          try {
            const value = await decryptJson<unknown>(dek, { iv: row.iv, ct: row.ciphertext });
            if (isVaultDocument(value)) {
              documents.push({ id: row.id, ...value });
              continue;
            }
            const fields = await openAccount(dek, row.iv, row.ciphertext);
            next.push({ id: row.id, ...fields });
          } catch {
            /* skip an entry that cannot be decrypted */
          }
        }
        if (!cancel) {
          setItems(next);
          setDocs(documents);
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

  useEffect(() => {
    if (!dek) return;
    let last = Date.now();
    const mark = () => {
      last = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, mark, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - last >= lockMinutes * 60_000) lock();
    }, 5000);
    const onHide = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= lockMinutes * 60_000) lock();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      events.forEach((event) => window.removeEventListener(event, mark));
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [dek, lock, lockMinutes]);

  const categories = useMemo(
    () => resolveCategories(catalog, (items ?? []).map((item) => item.category)),
    [catalog, items],
  );
  const visible = useMemo(() => {
    return (items ?? []).filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      return matchesQuery(item, query, categories);
    });
  }, [items, category, query, categories]);

  const suggestions = useMemo(() => {
    const needle = query.trim();
    if (needle.length < 2) return [];
    const seen = new Set<string>();
    const list: string[] = [];
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

  function selectSuggestion(label: string) {
    const service = label.split(" · ")[0] ?? label;
    const extra = label.includes(" · ") ? label.slice(label.indexOf(" · ") + 3) : "";
    const matches = (items ?? []).filter((item) => {
      if (item.service.trim() !== service) return false;
      if (!extra) return true;
      return (item.email.trim() || item.username.trim()) === extra;
    });
    setQuery(service);
    setCategory("all");
    setSuggestOpen(false);
    if (matches.length === 0) return;
    setOpenIds((current) => {
      const next = { ...current };
      for (const item of matches) next[item.id] = true;
      return next;
    });
    setOpenCats((current) => {
      const next = { ...current };
      for (const item of matches) next[item.category] = true;
      return next;
    });
    const target = matches[0]?.id;
    if (!target) return;
    window.setTimeout(() => {
      document.getElementById(`compte-${target}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 50);
  }

  const demoStillThere = demoIds.filter((id) => items?.some((item) => item.id === id));

  async function onUnlock(event: React.FormEvent) {
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

  async function onUnlockBiometric() {
    if (!meta || !email) return;
    const saved = readBiometricLogin();
    if (!saved || saved.email !== email.trim().toLowerCase()) {
      setUnlockError("Cette empreinte n'est pas liée à ce compte.");
      return;
    }
    setUnlocking(true);
    setUnlockError(null);
    try {
      await verifyBiometric(saved.credentialId);
      const next = await unlockVault(saved.password, meta);
      setUnlockPassword("");
      setDek(next);
    } catch {
      setUnlockError("Empreinte refusée pour ce compte.");
    } finally {
      setUnlocking(false);
    }
  }

  async function onSetup(event: React.FormEvent) {
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

  async function onSave(fields: AccountFields) {
    if (!dek) return;
    setSaving(true);
    try {
      const existingId = editing && editing !== "new" ? editing.id : crypto.randomUUID();
      const sealed = await sealAccount(dek, fields);
      const row = {
        id: existingId,
        iv: sealed.iv,
        ciphertext: sealed.ciphertext,
        hasPassword: fields.password.trim().length > 0,
      };
      await upsertItem({ data: row });
      const saved: VaultItem = { id: existingId, ...fields };
      setItems((current) => {
        const list = current ?? [];
        const index = list.findIndex((item) => item.id === existingId);
        if (index === -1) return [...list, saved];
        return list.map((item) => (item.id === existingId ? saved : item));
      });
      setEditing(null);
      toast("Compte enregistré");
    } catch (caught) {
      toast(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
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

  function persistCatalog(next: CategoryCatalog) {
    setCatalog(next);
    writeCategoryCatalog(userId, next);
  }

  function addCategory(event: React.FormEvent) {
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
    const removed = catalog.removed.filter((entry) => entry !== id);
    const builtin = resolveCategories({ removed: [], added: [] }).some((entry) => entry.id === id);
    persistCatalog({
      removed,
      added: builtin ? catalog.added : [...catalog.added.filter((entry) => entry.id !== id), { id, label }],
    });
    setCategoryName("");
    setCategory(id);
  }

  function saveRename(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    const label = editingLabel.trim().slice(0, 32);
    if (!label) {
      toast("Indiquez un nom de catégorie.");
      return;
    }
    const taken = categories.some(
      (entry) => entry.id !== editingId && entry.label.toLowerCase() === label.toLowerCase(),
    );
    if (taken) {
      toast("Cette catégorie existe déjà.");
      return;
    }
    persistCatalog({
      removed: catalog.removed,
      added: [...catalog.added.filter((entry) => entry.id !== editingId), { id: editingId, label }],
    });
    setEditingId(null);
    setEditingLabel("");
  }

  async function removeCategory(id: string) {
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
        const fields: AccountFields = {
          service: item.service,
          category: fallback,
          username: item.username,
          email: item.email,
          password: item.password,
          phone: item.phone,
          notes: item.notes,
        };
        const sealed = await sealAccount(dek, fields);
        await upsertItem({
          data: {
            id: item.id,
            iv: sealed.iv,
            ciphertext: sealed.ciphertext,
            hasPassword: fields.password.trim().length > 0,
          },
        });
      }
      if (affected.length > 0) {
        setItems((current) =>
          (current ?? []).map((item) => (item.category === id ? { ...item, category: fallback } : item)),
        );
      }
      persistCatalog({
        removed: catalog.removed.includes(id) ? catalog.removed : [...catalog.removed, id],
        added: catalog.added.filter((entry) => entry.id !== id),
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

  if (!mounted) return <PageSkeleton />;

  if (!dek) {
    return (
      <main className="screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center">
        <Brand subtitle={email ?? "Coffre verrouillé"} />
        {!metaReady ? (
          <p className="mt-8 text-sm text-muted">Ouverture de la session…</p>
        ) : meta ? (
          <form className="mt-8 space-y-4" onSubmit={(event) => void onUnlock(event)}>
            <p className="text-sm text-muted">
              Le coffre est verrouillé. Saisissez votre mot de passe, ou l'empreinte de ce compte, pour le rouvrir.
            </p>
            <SecretField
              label="Mot de passe"
              value={unlockPassword}
              onChange={setUnlockPassword}
              autoComplete="current-password"
            />
            {unlockError ? <Alert>{unlockError}</Alert> : null}
            {loadError ? <Alert>{loadError}</Alert> : null}
            <button type="submit" className="btn btn-primary w-full" disabled={unlocking}>
              {unlocking ? "Déchiffrement…" : "Déverrouiller"}
            </button>
            {readBiometricLogin()?.email === email?.trim().toLowerCase() ? (
              <button
                type="button"
                className="bio-btn"
                disabled={unlocking}
                aria-label="Déverrouiller avec l'empreinte du compte"
                onClick={() => void onUnlockBiometric()}
              >
                <span className="bio-mark" aria-hidden="true" />
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary w-full" disabled={signingOut} onClick={() => void onSignOut()}>
              {signingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={(event) => void onSetup(event)}>
            <p className="text-sm text-muted">
              Ce compte n'a pas encore de coffre chiffré. Confirmez le mot de passe de connexion pour le créer.
            </p>
            <SecretField
              label="Mot de passe"
              value={setupPassword}
              onChange={setSetupPassword}
              autoComplete="current-password"
            />
            {unlockError ? <Alert>{unlockError}</Alert> : null}
            <button type="submit" className="btn btn-primary w-full" disabled={unlocking}>
              {unlocking ? "Création…" : "Créer le chiffrement"}
            </button>
          </form>
        )}
      </main>
    );
  }

  const confirmItem = items?.find((item) => item.id === confirmId) ?? null;

  return (
    <main className="vault-shell mx-auto w-full max-w-3xl px-4 py-4 sm:py-10">
      <button
        type="button"
        className="corner-btn signout-btn"
        aria-label="Déconnexion et verrouillage"
        disabled={signingOut}
        onClick={() => void onSignOut()}
      >
        <Power size={20} aria-hidden="true" />
      </button>
      <button type="button" className="corner-btn docs-corner" aria-label="Documents" onClick={() => setDocsOpen(true)}>
        <span className="doc-ico" aria-hidden="true" />
      </button>
      <button type="button" className="corner-btn settings-corner" aria-label="Réglages" onClick={() => setSettingsOpen(true)}>
        <Settings size={20} aria-hidden="true" />
      </button>
      <aside className="vault-dash" aria-label="Tableau de bord">
        <p className="vault-dash-title">Tableau de bord</p>
        <button
          type="button"
          className="btn btn-secondary vault-dash-btn"
          onClick={() => {
            setDocsOpen(false);
            setSettingsOpen(false);
            setCatalogOpen(false);
            setCategory("all");
            setQuery("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Home size={18} aria-hidden="true" />
          Retour à l'accueil
        </button>
        <button type="button" className="btn btn-secondary vault-dash-btn" onClick={() => setSettingsOpen(true)}>
          <Settings size={18} aria-hidden="true" />
          Réglages
        </button>
        <DashThemeButton />
        <button type="button" className="btn btn-secondary vault-dash-btn" onClick={() => setDocsOpen(true)}>
          <span className="doc-ico" aria-hidden="true" />
          Documents
        </button>
        <button type="button" className="btn btn-secondary vault-dash-btn" disabled={signingOut} onClick={() => void onSignOut()}>
          <Power size={18} aria-hidden="true" />
          {signingOut ? "Déconnexion…" : "Déconnexion"}
        </button>
      </aside>
      <div className="vault-body">
      <header className="vault-head z-10 -mx-4 border-b border-line bg-bg px-4 pb-3 sm:sticky sm:top-0 sm:pb-4 sm:pt-2">
        <div className="vault-brand flex min-w-0 items-center gap-3">
            <Mark />
            <div className="min-w-0">
              <h1 className="vault-word">MELVAULT</h1>
              <p className="vault-count">
                {items
                  ? items.length <= 1
                    ? `${items.length} mot de passe enregistré pour ton compte`
                    : `${items.length} mots de passe enregistrés pour ton compte`
                  : "Chargement…"}
              </p>
            </div>
          </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" size={18} aria-hidden="true" />
            <input
              className="field field-search"
              type="search"
              placeholder={listening ? "Parlez…" : "Rechercher un compte…"}
              value={query}
              autoComplete="off"
              spellCheck={false}
              aria-label="Rechercher un compte"
              aria-expanded={suggestOpen && suggestions.length > 0}
              aria-autocomplete="list"
              onChange={(event) => {
                setQuery(event.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setSuggestOpen(false)}
            />
            <button
              type="button"
              className="mic-btn"
              aria-pressed={listening}
              aria-label={listening ? "Arrêter la recherche vocale" : "Recherche vocale"}
              onClick={() => {
                if (speechRef.current) {
                  speechRef.current.stop();
                  speechRef.current = null;
                  setListening(false);
                  return;
                }
                const host = window as Window & {
                  SpeechRecognition?: new () => SpeechRec;
                  webkitSpeechRecognition?: new () => SpeechRec;
                };
                const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
                if (!Ctor) {
                  toast("La recherche vocale n'est pas disponible sur ce navigateur.");
                  return;
                }
                const rec = new Ctor();
                rec.lang = "fr-FR";
                rec.interimResults = false;
                rec.continuous = false;
                rec.onresult = (event) => {
                  const text = event.results[0]?.[0]?.transcript?.trim() ?? "";
                  if (!text) return;
                  setQuery(text);
                  setCategory("all");
                  setSuggestOpen(true);
                };
                rec.onerror = () => {
                  speechRef.current = null;
                  setListening(false);
                };
                rec.onend = () => {
                  speechRef.current = null;
                  setListening(false);
                };
                try {
                  rec.start();
                  speechRef.current = rec;
                  setListening(true);
                } catch {
                  toast("Impossible de démarrer le micro.");
                }
              }}
            >
              <Mic size={18} aria-hidden="true" />
            </button>
            {suggestOpen && suggestions.length > 0 ? (
              <ul className="suggest" role="listbox">
                {suggestions.map((label) => (
                  <li key={label}>
                    <button
                      type="button"
                      role="option"
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(label)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} aria-hidden="true" />
            Ajouter
          </button>
        </div>
      </header>

      {docsOpen ? (
        <DocumentsScreen
          dek={dek}
          userId={userId}
          email={email}
          docs={docs}
          onChange={setDocs}
          onClose={() => setDocsOpen(false)}
        />
      ) : (
      <>
      <div className="cat-grid">
        <button
          type="button"
          className="btn btn-secondary cat-manage"
          aria-pressed={catalogOpen}
          aria-label="Gérer les catégories"
          onClick={() => setCatalogOpen((open) => !open)}
        >
          <Tags size={16} aria-hidden="true" />
          Catégories
        </button>
      </div>

      {catalogOpen ? (
        <div className="cat-editor">
          <p className="cat-editor-head text-sm font-medium">Catégories</p>
          <ul className="cat-editor-list mt-2 space-y-1">
            {categories.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
                {editingId === entry.id ? (
                  <form className="flex min-w-0 flex-1 gap-2" onSubmit={saveRename}>
                    <input
                      className="field"
                      value={editingLabel}
                      maxLength={32}
                      aria-label={`Nouveau nom pour ${entry.label}`}
                      onChange={(event) => setEditingLabel(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary shrink-0" disabled={categoryBusy}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="btn-quiet shrink-0"
                      onClick={() => {
                        setEditingId(null);
                        setEditingLabel("");
                      }}
                    >
                      Annuler
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="min-w-0 truncate">{entry.label}</span>
                    <span className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="btn-quiet"
                        disabled={categoryBusy}
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditingLabel(entry.label);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn-quiet"
                        disabled={categoryBusy}
                        onClick={() => void removeCategory(entry.id)}
                      >
                        Retirer
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={addCategory}>
            <input
              className="field"
              value={categoryName}
              placeholder="Nouvelle catégorie"
              maxLength={32}
              aria-label="Nouvelle catégorie"
              onChange={(event) => setCategoryName(event.target.value)}
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={categoryBusy}>
              Ajouter
            </button>
          </form>
        </div>
      ) : null}

      {query.trim() || category !== "all" ? (
        <p className="mt-4 text-sm text-muted tabular-nums" aria-live="polite">
          {compteLabel(visible.length)} affiché{visible.length === 1 ? "" : "s"}
        </p>
      ) : null}

      {loadError ? (
        <div className="mt-4">
          <Alert>{loadError}</Alert>
        </div>
      ) : null}

      {!hideDemoNote && demoStillThere.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Exemples fictifs pour essayer le coffre. Aucune donnée réelle. Vous pouvez les retirer d'un coup.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-quiet" onClick={() => void removeDemos()}>
              Retirer les exemples
            </button>
            <button type="button" className="btn-quiet" onClick={() => setHideDemoNote(true)}>
              Masquer
            </button>
          </div>
        </div>
      ) : null}

      {items === null ? (
        <div className="mt-6 space-y-3">
          <div className="card h-28 animate-pulse" />
          <div className="card h-28 animate-pulse" />
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {items.length === 0 ? "Aucun compte pour le moment." : "Aucun compte ne correspond."}
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {categories.filter((entry) => category === "all" || category === entry.id).map((entry) => {
            const group = visible.filter((item) => item.category === entry.id);
            if (group.length === 0) return null;
            const Icon = entry.icon;
            const catOpen = openCats[entry.id] === true;
            return (
              <section key={entry.id}>
                <button
                  type="button"
                  className="cat-title mb-2 flex w-full items-center gap-2 text-left"
                  aria-expanded={catOpen}
                  onClick={() => setOpenCats((current) => ({ ...current, [entry.id]: !current[entry.id] }))}
                >
                  <Icon size={19} aria-hidden="true" />
                  {entry.label}
                  <span className="tabular-nums">{group.length}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`ml-auto shrink-0 text-muted ${catOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {catOpen ? (
                <div className="vault-accounts space-y-1.5">
                  {group.map((item) => {
                    const open = openIds[item.id] === true;
                    return (
                      <article id={`compte-${item.id}`} key={item.id} className="overflow-hidden rounded-control border border-line bg-surface">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
                          aria-expanded={open}
                          onClick={() =>
                            setOpenIds((current) => ({ ...current, [item.id]: !current[item.id] }))
                          }
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.service}</span>
                          <ChevronDown
                            size={16}
                            aria-hidden="true"
                            className={`shrink-0 text-muted ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                        {open ? (
                          <div className="border-t border-line px-3 py-3">
                            <dl className="space-y-3">
                              {filled(item.username) ? (
                                <FieldLine
                                  label="Identifiant"
                                  value={item.username}
                                  onCopy={() => void copyValue(item.username, "Identifiant copié")}
                                />
                              ) : null}
                              {filled(item.email) ? (
                                <FieldLine
                                  label="E-mail"
                                  value={item.email}
                                  onCopy={() => void copyValue(item.email, "E-mail copié")}
                                />
                              ) : null}
                              {filled(item.password) ? (
                                <div>
                                  <dt className="text-xs text-muted">Mot de passe</dt>
                                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className={revealed[item.id] ? "secret" : "tracking-widest text-muted"}>
                                      {revealed[item.id] ? item.password : MASK}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn-quiet"
                                      onClick={() =>
                                        setRevealed((current) => ({ ...current, [item.id]: !current[item.id] }))
                                      }
                                    >
                                      {revealed[item.id] ? "Masquer" : "Afficher"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-quiet"
                                      onClick={() => void copyValue(item.password, "Mot de passe copié")}
                                    >
                                      <Copy size={14} aria-hidden="true" />
                                      Copier
                                    </button>
                                  </dd>
                                </div>
                              ) : null}
                              {filled(item.phone) ? (
                                <FieldLine
                                  label="Téléphone"
                                  value={item.phone}
                                  onCopy={() => void copyValue(item.phone, "Téléphone copié")}
                                />
                              ) : null}
                              {filled(item.notes) ? (
                                <div>
                                  <dt className="text-xs text-muted">Notes</dt>
                                  <dd className="mt-1 text-sm whitespace-pre-wrap">{item.notes}</dd>
                                </div>
                              ) : null}
                            </dl>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" className="btn-quiet" onClick={() => setEditing(item)}>
                                Modifier
                              </button>
                              <button type="button" className="btn-quiet danger" onClick={() => setConfirmId(item.id)}>
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-subtle">
        Chiffrement sur cet appareil. Le serveur ne stocke que des données illisibles.
      </p>
      </>
      )}

      {editing ? (
        <AccountDialog
          title={editing === "new" ? "Ajouter un compte" : "Modifier le compte"}
          initial={editing === "new" ? null : editing}
          pending={saving}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={(fields) => void onSave(fields)}
        />
      ) : null}

      {settingsOpen && meta ? (
        <SettingsDialog
          dek={dek}
          meta={meta}
          items={items ?? []}
          lockMinutes={lockMinutes}
          onLockMinutes={(minutes) => {
            setLockMinutes(minutes);
            writeLockMinutes(minutes);
          }}
          onLockNow={lock}
          onClose={() => setSettingsOpen(false)}
          onImported={(added) => setItems((current) => [...(current ?? []), ...added])}
          onPasswordWrap={(dekPassword) => setMeta((current) => (current ? { ...current, dekPassword } : current))}
        />
      ) : null}

      {confirmItem ? (
        <div className="modal-root" onMouseDown={() => setConfirmId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Supprimer le compte"
            className="modal-panel"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-2xl tracking-tight">Supprimer {confirmItem.service} ?</h2>
            <p className="mt-2 text-sm text-muted">Cette fiche sera retirée du coffre. Les autres comptes du même service restent.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmId(null)}>
                Annuler
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void onDelete(confirmItem.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {freshCode ? (
        <div className="modal-root">
          <div role="dialog" aria-modal="true" aria-label="Code de récupération" className="modal-panel space-y-4">
            <h2 className="font-display text-2xl tracking-tight">Code de récupération</h2>
            <p className="text-sm text-muted">Conservez-le hors ligne. Il permet de retrouver le coffre si vous oubliez le mot de passe.</p>
            <p className="secret rounded-control bg-surface-2 px-3 py-3 text-center">{freshCode}</p>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={keptCode} onChange={(event) => setKeptCode(event.target.checked)} />
              J'ai noté ce code.
            </label>
            <button type="button" className="btn btn-primary w-full" disabled={!keptCode} onClick={() => setFreshCode(null)}>
              Continuer
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </main>
  );
}

function DashThemeButton() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  useEffect(() => {
    setTheme(readTheme());
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="btn btn-secondary vault-dash-btn"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      Mode clair / sombre
    </button>
  );
}

function FieldLine({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2">
        <span className="secret text-sm">{value || "—"}</span>
        <button type="button" className="btn-quiet" onClick={onCopy}>
          <Copy size={14} aria-hidden="true" />
          Copier
        </button>
      </dd>
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { Alert, Dialog, SecretField, StrengthMeter } from "@/components/ui";
import {
  changeLoginPassword,
  errorText,
  exportVault,
  importVault,
  rewrapWithPassword,
  savePasswordWrap,
  unlockVault,
} from "@/lib/vault/actions";
import { decryptJson, parsePack, sealAccount } from "@/lib/vault/crypto";
import { insertItems, type VaultMeta } from "@/lib/vault/api";
import { rotateRememberedPassword } from "@/lib/vault/memory";
import type { AccountFields, VaultItem } from "@/lib/vault/types";

export function SettingsDialog({
  dek,
  meta,
  items,
  lockMinutes,
  onLockMinutes,
  onLockNow,
  onClose,
  onImported,
  onPasswordWrap,
}: {
  dek: CryptoKey;
  meta: VaultMeta;
  items: VaultItem[];
  lockMinutes: number;
  onLockMinutes: (minutes: number) => void;
  onLockNow: () => void;
  onClose: () => void;
  onImported: (items: VaultItem[]) => void;
  onPasswordWrap: (dekPassword: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pendingPassword, setPendingPassword] = useState(false);
  const [pendingWrap, setPendingWrap] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [exportPass, setExportPass] = useState("");
  const [exportConfirm, setExportConfirm] = useState("");
  const [importPass, setImportPass] = useState("");
  const [importFile, setImportFile] = useState<string | null>(null);
  const [importName, setImportName] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState(false);

  async function revealCode() {
    try {
      const parsed = await decryptJson<{ code?: string }>(dek, parsePack(meta.recoveryHint));
      if (!parsed.code) throw new Error("Code illisible");
      setCode(parsed.code);
    } catch {
      toast("Code de récupération illisible");
    }
  }

  async function onChangePassword(event: React.FormEvent) {
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
        setPasswordError(
          `${errorText(caught)} Le mot de passe de connexion a changé. Relancez pour enregistrer le chiffrement.`,
        );
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

  async function onExport(event: React.FormEvent) {
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
      const file = await exportVault(
        items.map(({ service, category, username, email, password, phone, notes }) => ({
          service,
          category,
          username,
          email,
          password,
          phone,
          notes,
        })),
        exportPass,
      );
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

  async function onImport(event: React.FormEvent) {
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
        sealed.push({ ...row, hasPassword: account.password.trim().length > 0 });
      }
      await insertItems({ data: { items: sealed } });
      const added: VaultItem[] = sealed.map((row, index) => ({
        id: row.id,
        ...(accounts[index] as AccountFields),
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

  return (
    <Dialog title="Réglages" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Réglages</h2>
          <button type="button" className="btn-quiet" onClick={onClose}>
            Fermer
          </button>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Verrouillage automatique</h3>
          <label className="block text-sm text-muted">
            Après inactivité
            <select
              className="field mt-1.5"
              value={lockMinutes}
              onChange={(event) => onLockMinutes(Number(event.target.value))}
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </label>
          <button type="button" className="btn btn-secondary" onClick={onLockNow}>
            Verrouiller maintenant
          </button>
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-medium">Mot de passe de connexion</h3>
          <form className="space-y-3" onSubmit={(event) => void onChangePassword(event)}>
            <SecretField label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <SecretField label="Nouveau mot de passe" value={nextPassword} onChange={setNextPassword} autoComplete="new-password" />
            <StrengthMeter password={nextPassword} />
            <SecretField label="Confirmer" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            {passwordError ? <Alert>{passwordError}</Alert> : null}
            <button type="submit" className="btn btn-primary" disabled={pendingPassword}>
              {pendingPassword ? "Mise à jour…" : pendingWrap ? "Réenregistrer le chiffrement" : "Changer le mot de passe"}
            </button>
          </form>
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-medium">Code de récupération</h3>
          <p className="text-sm text-muted">Il ne change pas quand vous modifiez le mot de passe de connexion.</p>
          {code ? <p className="secret rounded-control bg-surface-2 px-3 py-3">{code}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => void revealCode()}>
              {code ? "Réafficher" : "Afficher"}
            </button>
            {code ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(code).then(
                    () => toast("Code copié"),
                    () => toast("Copie impossible"),
                  );
                }}
              >
                Copier
              </button>
            ) : null}
          </div>
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-medium">Exporter</h3>
          <p className="text-sm text-muted">
            Le fichier est chiffré. Il ne contient pas les mots de passe en clair. Choisissez une phrase secrète pour l'ouvrir plus tard.
          </p>
          <form className="space-y-3" onSubmit={(event) => void onExport(event)}>
            <SecretField label="Phrase secrète" value={exportPass} onChange={setExportPass} autoComplete="new-password" />
            <SecretField label="Confirmer" value={exportConfirm} onChange={setExportConfirm} autoComplete="new-password" />
            <button type="submit" className="btn btn-secondary" disabled={pendingTransfer}>
              Télécharger le coffre chiffré
            </button>
          </form>
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-medium">Importer</h3>
          <p className="text-sm text-muted">
            Les comptes importés sont ajoutés tels quels. Deux fiches du même service restent distinctes.
          </p>
          <form className="space-y-3" onSubmit={(event) => void onImport(event)}>
            <label className="btn btn-secondary cursor-pointer">
              {importName || "Choisir un fichier"}
              <input
                className="sr-only"
                type="file"
                accept=".vault,application/json,application/octet-stream"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2_000_000) {
                    setTransferError("Fichier trop volumineux.");
                    return;
                  }
                  setImportName(file.name);
                  void file.text().then(setImportFile);
                }}
              />
            </label>
            <SecretField label="Phrase secrète du fichier" value={importPass} onChange={setImportPass} autoComplete="current-password" />
            {transferError ? <Alert>{transferError}</Alert> : null}
            <button type="submit" className="btn btn-primary" disabled={pendingTransfer}>
              {pendingTransfer ? "Import…" : "Importer"}
            </button>
          </form>
        </section>
      </div>
    </Dialog>
  );
}

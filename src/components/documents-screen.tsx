import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui";
import { deleteItems, upsertItem } from "@/lib/vault/api";
import { readBiometricLogin, verifyBiometric } from "@/lib/vault/biometric";
import { encryptJson } from "@/lib/vault/crypto";
import {
  checkDocumentPin,
  clearDocumentPin,
  DOCUMENT_ACCEPT,
  hasDocumentPin,
  MAX_DOCUMENTS,
  prepareDocumentFile,
  saveDocumentPin,
  type StoredDocument,
} from "@/lib/vault/documents";

export function DocumentsScreen({
  dek,
  userId,
  email,
  docs,
  onChange,
  onClose,
}: {
  dek: CryptoKey;
  userId: string;
  email: string | null;
  docs: StoredDocument[];
  onChange: (docs: StoredDocument[]) => void;
  onClose: () => void;
}) {
  const [unlockedId, setUnlockedId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(() => !hasDocumentPin(userId));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [creatingPin, setCreatingPin] = useState(() => !hasDocumentPin(userId));
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const accountBio = readBiometricLogin();
  const bioReady = Boolean(
    accountBio && email && accountBio.email === email.trim().toLowerCase(),
  );

  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "visible") return;
      window.setTimeout(() => {
        if (document.visibilityState !== "visible") setUnlockedId(null);
      }, 500);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  async function saveDocs(files: File[]) {
    if (files.length === 0) return;
    const room = MAX_DOCUMENTS - docs.length;
    if (room <= 0) {
      toast("10 documents maximum.");
      return;
    }
    const batch = files.slice(0, room);
    const skipped = files.length - batch.length;
    setBusy(true);
    const added: StoredDocument[] = [];
    let failed = 0;
    try {
      let lastError = "";
      for (const file of batch) {
        try {
          const prepared = await prepareDocumentFile(file);
          const record = {
            kind: "document" as const,
            docType: "other" as const,
            title: (file.name.replace(/\.[^.]+$/, "") || "Document").slice(0, 40),
            image: prepared.image,
            mime: prepared.mime,
          };
          const sealed = await encryptJson(dek, record);
          const id = crypto.randomUUID();
          await upsertItem({ data: { id, iv: sealed.iv, ciphertext: sealed.ct, hasPassword: false } });
          added.push({ id, ...record });
        } catch (caught) {
          failed += 1;
          lastError = caught instanceof Error ? caught.message : "";
        }
      }
      if (added.length > 0) {
        onChange([...docs, ...added]);
        setUnlockedId(null);
      }
      if (failed === 0) toast(added.length > 1 ? `${added.length} documents enregistrés` : "Document enregistré");
      else if (added.length === 0) toast(lastError || "Enregistrement impossible.");
      else toast(`${added.length} enregistrés, ${failed} ignorés.`);
      if (skipped > 0) toast("10 documents maximum.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDoc(file: File, existingId?: string, title?: string) {
    setBusy(true);
    try {
      const prepared = await prepareDocumentFile(file);
      const record = {
        kind: "document" as const,
        docType: "other" as const,
        title: (title ?? (file.name.replace(/\.[^.]+$/, "") || "Document")).slice(0, 40),
        image: prepared.image,
        mime: prepared.mime,
      };
      const sealed = await encryptJson(dek, record);
      const id = existingId ?? crypto.randomUUID();
      await upsertItem({ data: { id, iv: sealed.iv, ciphertext: sealed.ct, hasPassword: false } });
      const saved: StoredDocument = { id, ...record };
      onChange(existingId ? docs.map((doc) => (doc.id === id ? saved : doc)) : [...docs, saved]);
      setUnlockedId(null);
      toast("Document enregistré");
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id: string) {
    setBusy(true);
    try {
      await deleteItems({ data: { ids: [id] } });
      onChange(docs.filter((doc) => doc.id !== id));
      if (unlockedId === id) setUnlockedId(null);
    } catch {
      toast("Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  function pressDigit(digit: string) {
    setPinError(null);
    if (creatingPin && pin.length >= 6) {
      setPinConfirm((value) => (value.length >= 6 ? value : value + digit));
      return;
    }
    setPin((value) => (value.length >= 6 ? value : value + digit));
  }

  function eraseDigit() {
    setPinError(null);
    if (creatingPin && pin.length >= 6 && pinConfirm.length > 0) {
      setPinConfirm((value) => value.slice(0, -1));
      return;
    }
    if (creatingPin && pin.length >= 6) {
      setPin((value) => value.slice(0, -1));
      return;
    }
    setPin((value) => value.slice(0, -1));
  }

  function unlock(id: string) {
    setPinError(null);
    setPin("");
    setPinConfirm("");
    setPendingId(id);
    setCreatingPin(!hasDocumentPin(userId));
    setPinOpen(true);
  }

  async function submitPin(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setPinError("Le code doit contenir 6 chiffres.");
      return;
    }
    setBusy(true);
    setPinError(null);
    try {
      if (creatingPin) {
        if (pin !== pinConfirm) {
          setPinError("Les deux codes ne correspondent pas.");
          return;
        }
        await saveDocumentPin(userId, pin);
        toast("Code enregistré pour tous les documents");
      } else if (!(await checkDocumentPin(userId, pin))) {
        setPinError("Code incorrect.");
        return;
      }
      if (pendingId) setUnlockedId(pendingId);
      setPinOpen(false);
      setPendingId(null);
      setPin("");
      setPinConfirm("");
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithBiometric() {
    if (!accountBio || !bioReady || creatingPin) return;
    setBusy(true);
    setPinError(null);
    try {
      await verifyBiometric(accountBio.credentialId);
      if (pendingId) setUnlockedId(pendingId);
      setPinOpen(false);
      setPendingId(null);
      setPin("");
      setPinConfirm("");
    } catch {
      setPinError("Empreinte refusée pour ce compte.");
    } finally {
      setBusy(false);
    }
  }

  async function resetDocuments() {
    setBusy(true);
    try {
      if (docs.length > 0) await deleteItems({ data: { ids: docs.map((doc) => doc.id) } });
      clearDocumentPin(userId);
      onChange([]);
      setUnlockedId(null);
      setResetOpen(false);
      setPendingId(null);
      setPin("");
      setPinConfirm("");
      setCreatingPin(true);
      setPinOpen(true);
      toast("Documents réinitialisés");
    } catch {
      toast("Réinitialisation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6">
      <button type="button" className="btn btn-secondary page-btn" onClick={onClose}>
        <ArrowLeft size={14} aria-hidden="true" />
        Coffre
      </button>
      <h2 className="mt-4 font-display text-2xl tracking-tight">Documents</h2>
      <p className="mt-2 text-sm text-muted">
        Un seul code déverrouille tous les documents. 2 Mo par fichier, 10 documents maximum.
      </p>
      <label className="btn btn-secondary page-btn mt-4">
        Ajouter un document
        <input
          className="sr-only"
          type="file"
          accept={DOCUMENT_ACCEPT}
          multiple
          disabled={busy}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void saveDocs(files);
          }}
        />
      </label>
      <button type="button" className="btn btn-secondary page-btn mt-2" disabled={busy} onClick={() => setResetOpen(true)}>
        Réinitialisation totale des documents
      </button>
      <div className="doc-board mt-5 space-y-4">
        {docs.map((doc) => (
          <DocumentCard
            key={doc.id}
            label={doc.title || "Document"}
            doc={doc}
            sharp={unlockedId === doc.id}
            busy={busy}
            onFile={(file) => void saveDoc(file, doc.id, doc.title)}
            onUnlock={() => unlock(doc.id)}
            onHide={() => setUnlockedId(null)}
            onRemove={() => void removeDoc(doc.id)}
          />
        ))}
      </div>
      {pinOpen ? (
        <div className="pin-root" onMouseDown={() => setPinOpen(false)}>
          <form
            className="pin-panel"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => void submitPin(event)}
          >
            <p className="text-center text-lg font-medium">
              {creatingPin ? "Choisissez un code à 6 chiffres" : "Code de déverrouillage"}
            </p>
            <p className="mt-2 text-center text-sm text-muted">
              {creatingPin ? "Ce code servira pour toutes les photos." : "Le code ou l'empreinte du compte ouvre toutes les photos."}
            </p>
            <PinDigits value={pin} label="Code à 6 chiffres" />
            {creatingPin ? <PinDigits value={pinConfirm} label="Confirmer le code" /> : null}
            <div className="pin-keys">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button key={digit} type="button" onClick={() => pressDigit(digit)}>
                  {digit}
                </button>
              ))}
              <span />
              <button type="button" onClick={() => pressDigit("0")}>
                0
              </button>
              <button type="button" aria-label="Effacer" onClick={eraseDigit}>
                ⌫
              </button>
            </div>
            {pinError ? <Alert>{pinError}</Alert> : null}
            {!creatingPin && bioReady ? (
              <button
                type="button"
                className="doc-bio"
                aria-label="Déverrouiller avec l'empreinte du compte"
                disabled={busy}
                onClick={() => void unlockWithBiometric()}
              >
                <span className="bio-mark" aria-hidden="true" />
              </button>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
                {busy ? "Vérification…" : creatingPin ? "Enregistrer" : "Déverrouiller"}
              </button>
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setPinOpen(false)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {resetOpen ? (
        <div className="pin-root" onMouseDown={() => setResetOpen(false)}>
          <div className="pin-panel" onMouseDown={(event) => event.stopPropagation()}>
            <p className="text-center text-lg font-medium">Réinitialisation totale des documents</p>
            <p className="mt-2 text-center text-sm text-muted">
              Toutes les photos et le code seront supprimés. Tu pourras en choisir un nouveau.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={() => void resetDocuments()}>
                {busy ? "Suppression…" : "Tout supprimer"}
              </button>
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setResetOpen(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PinDigits({ value, label }: { value: string; label: string }) {
  const previous = useRef("");
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);

  useEffect(() => {
    if (value.length > previous.current.length) {
      const index = value.length - 1;
      setVisibleIndex(index);
      const timer = window.setTimeout(() => {
        setVisibleIndex((current) => (current === index ? null : current));
      }, 550);
      previous.current = value;
      return () => window.clearTimeout(timer);
    }
    previous.current = value;
    setVisibleIndex(null);
  }, [value]);

  return (
    <div className="pin-slots" aria-label={label}>
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index}>{value[index] ? (visibleIndex === index ? value[index] : "*") : ""}</span>
      ))}
    </div>
  );
}

function DocumentCard({
  label,
  doc,
  sharp,
  busy,
  onFile,
  onUnlock,
  onHide,
  onRemove,
}: {
  label: string;
  doc: StoredDocument | null;
  sharp: boolean;
  busy: boolean;
  onFile: (file: File) => void;
  onUnlock: () => void;
  onHide: () => void;
  onRemove: () => void;
}) {
  const inputId = useId();
  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="doc-ico" aria-hidden="true" />
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      {doc ? (
        <DocumentPreview image={doc.image} mime={doc.mime || "image/jpeg"} sharp={sharp} label={label} />
      ) : (
        <p className="mt-3 text-sm text-muted">Aucun fichier.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="btn btn-secondary page-btn">
          {doc ? "Remplacer" : "Ajouter une photo"}
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept={DOCUMENT_ACCEPT}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
        {doc ? (
          <button type="button" className="btn btn-secondary page-btn" disabled={busy} onClick={sharp ? onHide : onUnlock}>
            {sharp ? "Masquer" : "Déverrouiller"}
          </button>
        ) : null}
        {doc ? (
          <button type="button" className="btn-quiet" disabled={busy} onClick={onRemove}>
            Retirer
          </button>
        ) : null}
      </div>
    </article>
  );
}

function DocumentPreview({
  image,
  mime,
  sharp,
  label,
}: {
  image: string;
  mime: string;
  sharp: boolean;
  label: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const visual = mime.startsWith("image/");
  const pdf = mime === "application/pdf";

  useEffect(() => {
    try {
      const binary = atob(image);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const next = URL.createObjectURL(new Blob([bytes], { type: mime || "application/octet-stream" }));
      setUrl(next);
      return () => URL.revokeObjectURL(next);
    } catch {
      setUrl(null);
    }
  }, [image, mime]);

  if (!url) return <p className="mt-3 text-sm text-muted">Aperçu indisponible.</p>;

  if (!visual && !pdf) {
    return (
      <div className={`doc-file mt-3 ${sharp ? "" : "is-locked"}`}>
        <p className="text-sm font-medium">{fileLabel(mime)}</p>
        <p className="mt-1 text-sm text-muted">{sharp ? label : "Verrouillé"}</p>
        {sharp ? (
          <a className="btn btn-secondary page-btn mt-3" href={url} target="_blank" rel="noreferrer">
            Ouvrir
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`doc-shield mt-3 ${sharp ? "" : "is-locked"}`}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {visual ? (
        <img src={url} alt={sharp ? label : ""} draggable={false} />
      ) : (
        <iframe title={sharp ? label : "Document"} src={sharp ? url : undefined} />
      )}
      <div className="doc-shield-cover" />
    </div>
  );
}

function fileLabel(mime: string): string {
  if (mime.includes("word") || mime.includes("opendocument.text")) return "Document Word";
  if (mime.includes("sheet") || mime.includes("excel") || mime === "text/csv") return "Tableur";
  if (mime.includes("presentation")) return "Présentation";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  return "Fichier";
}

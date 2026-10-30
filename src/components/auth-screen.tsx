import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Alert, Brand, Field, SecretField, StrengthMeter } from "@/components/ui";
import {
  createVault,
  errorText,
  signInEmail,
  signUpEmail,
  unlockVault,
} from "@/lib/vault/actions";
import { countVaultUsers, getMeta } from "@/lib/vault/api";
import { setDek, writeDemoIds, clearRememberedLogin, readRememberedLogin, writeRememberedLogin } from "@/lib/vault/memory";

type Mode = "login" | "signup";

export function AuthScreen({
  holdSession,
  releaseSession,
}: {
  holdSession: () => void;
  releaseSession: () => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [shownCode, setShownCode] = useState<string | null>(null);
  const [kept, setKept] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = readRememberedLogin();
    if (!saved) return;
    setEmail(saved.email);
    setPassword(saved.password);
    setRemember(true);
  }, []);

  useEffect(() => {
    let active = true;
    void countVaultUsers()
      .then((count) => {
        if (active) setUserCount(count);
      })
      .catch(() => {
        if (active) setUserCount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function finishLogin(address: string, secret: string) {
    holdSession();
    await signInEmail(address.trim(), secret);
    const meta = await getMeta();
    if (meta) {
      try {
        setDek(await unlockVault(secret, meta));
      } catch {
        setDek(null);
      }
    }
    if (remember) writeRememberedLogin(address, secret);
    else clearRememberedLogin();
    setPassword("");
    releaseSession();
    await navigate({ to: "/" });
  }

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await finishLogin(email, password);
    } catch (caught) {
      releaseSession();
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function onSignup(event: React.FormEvent) {
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

  function continueAfterRecovery() {
    releaseSession();
    void navigate({ to: "/" });
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
      "Ce fichier ne contient aucun mot de passe du coffre.",
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

  if (shownCode) {
    return (
      <main className="screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center">
        <Brand subtitle="Code de récupération" />
        <div className="card mt-8 space-y-4">
          <p className="text-sm text-muted">
            Notez ce code maintenant. C'est le seul moyen de choisir un nouveau mot de passe si vous
            oubliez celui de connexion. Il n'est pas envoyé par e-mail, et personne d'autre ne peut le lire.
          </p>
          <p className="secret rounded-control bg-surface-2 px-3 py-3 text-center text-base">{shownCode}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => void copyCode()}>
              Copier
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadCode}>
              Télécharger
            </button>
          </div>
          <p className="text-sm text-muted">
            Vous pourrez le réafficher plus tard dans Réglages, une fois le coffre déverrouillé.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={kept}
              onChange={(event) => setKept(event.target.checked)}
            />
            J'ai conservé ce code hors de cet appareil.
          </label>
          {error ? <Alert>{error}</Alert> : null}
          <button type="button" className="btn btn-primary w-full" disabled={!kept} onClick={continueAfterRecovery}>
            Ouvrir le coffre
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center">
      <Brand large subtitle="Vos mots de passe restent chiffrés sur cet appareil." />
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          className="chip"
          aria-pressed={mode === "login"}
          onClick={() => switchMode("login")}
        >
          Connexion
        </button>
        <button type="button" aria-pressed={mode === "signup"} className="chip" onClick={() => switchMode("signup")}>
          Créer un coffre
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(event) => void (mode === "login" ? onLogin(event) : onSignup(event))}>
          <Field label="Adresse e-mail">
            <input
              className="field"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <SecretField
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "signup" ? <StrengthMeter password={password} /> : null}
          {mode === "signup" ? (
            <SecretField label="Confirmer le mot de passe" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          ) : null}
          {mode === "signup" ? (
            <p className="text-sm text-muted">10 caractères minimum. Ce mot de passe déverrouille le chiffrement.</p>
          ) : null}
          {mode === "login" ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={remember}
                onChange={(event) => {
                  const on = event.target.checked;
                  setRemember(on);
                  if (!on) clearRememberedLogin();
                }}
              />
              <span>
                Mémoriser le mot de passe de connexion
                <span className="mt-0.5 block text-muted">
                  À vos risques et périls. Il reste sur cet appareil et peut être lu par quelqu'un qui l'utilise.
                </span>
              </span>
            </label>
          ) : null}
          {notice ? <p className="rounded-control bg-surface-2 px-3 py-2 text-sm">{notice}</p> : null}
          {error ? <Alert>{error}</Alert> : null}
          <button className="btn btn-primary w-full" type="submit" disabled={pending}>
            {pending ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer le coffre"}
          </button>
          {mode === "login" ? (
            <div className="flex items-baseline justify-between gap-3">
              <button
                type="button"
                className="text-sm text-muted underline-offset-2 hover:underline"
                onClick={() => void navigate({ to: "/mot-de-passe-oublie" })}
              >
                Mot de passe oublié
              </button>
              {userCount === null ? null : (
                <p className="text-right text-sm text-muted tabular-nums">
                  {userCount === 1 ? "1 utilisateur" : `${userCount} utilisateurs`}
                </p>
              )}
            </div>
          ) : null}
        </form>
    </main>
  );
}

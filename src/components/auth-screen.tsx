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
import { setDek, writeDemoIds, clearRememberedLogin, readRememberedLogin, writeRememberedLogin, readRememberedEmail, writeRememberedEmail, clearRememberedEmail } from "@/lib/vault/memory";
import {
  clearBiometricLogin,
  readBiometricLogin,
  registerBiometric,
  verifyBiometric,
  writeBiometricLogin,
} from "@/lib/vault/biometric";

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
  const [rememberEmail, setRememberEmail] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  useEffect(() => {
    const saved = readRememberedLogin();
    const savedEmail = readRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
    if (!saved) return;
    setEmail(saved.email);
    setPassword(saved.password);
    setRemember(true);
    setRememberEmail(true);
  }, []);

  useEffect(() => {
    const saved = readBiometricLogin();
    setBioSaved(Boolean(saved));
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

  function biometricError(caught: unknown): string {
    if (caught instanceof DOMException) {
      if (caught.name === "NotAllowedError") return "Empreinte ou visage refusé.";
      if (caught.name === "NotSupportedError" || caught.name === "SecurityError") {
        return "Empreinte ou visage indisponible sur cet appareil.";
      }
    }
    const message = errorText(caught);
    return message === "Une erreur est survenue." ? "Empreinte ou visage refusé." : message;
  }

  async function finishLogin(address: string, secret: string, credentialId?: string | null) {
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
    if (rememberEmail) writeRememberedEmail(address);
    else clearRememberedEmail();
    if (credentialId) {
      writeBiometricLogin(address, secret, credentialId);
      setBioSaved(true);
    } else if (credentialId === null) {
      clearBiometricLogin();
      setBioSaved(false);
    }
    setPassword("");
    releaseSession();
    await navigate({ to: "/" });
  }

  async function onBiometric() {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const saved = readBiometricLogin();
      const typed = email.trim().toLowerCase();
      if (saved) {
        if (typed !== saved.email) {
          setError(
            typed
              ? "Empreinte refusée : elle n'est pas liée à cet e-mail."
              : "Empreinte refusée : indiquez d'abord l'e-mail du compte.",
          );
          return;
        }
        await verifyBiometric(saved.credentialId);
        await finishLogin(typed, saved.password, saved.credentialId);
        return;
      }
      const normalized = email.trim().toLowerCase();
      if (!normalized || !password) {
        setError("Saisissez l'e-mail et le mot de passe, puis appuyez de nouveau.");
        return;
      }
      const credentialId = await registerBiometric(normalized);
      await finishLogin(email, password, credentialId);
    } catch (caught) {
      releaseSession();
      setError(caught instanceof DOMException ? biometricError(caught) : errorText(caught));
    } finally {
      setPending(false);
    }
  }

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const normalized = email.trim().toLowerCase();
      const existing = readBiometricLogin();
      const credentialId = existing && existing.email === normalized ? existing.credentialId : undefined;
      await finishLogin(email, password, credentialId);
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
    <main className="screen auth-fit flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center">
      <Brand large subtitle="Vos mots de passe restent chiffrés sur cet appareil." />
      <div className="auth-panel">
      <div className="auth-tabs flex gap-2">
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

      <form className="auth-form" onSubmit={(event) => void (mode === "login" ? onLogin(event) : onSignup(event))}>
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
          {mode === "login" ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={rememberEmail}
                onChange={(event) => {
                  const on = event.target.checked;
                  setRememberEmail(on);
                  if (!on) clearRememberedEmail();
                }}
              />
              <span>Mémoriser l'adresse e-mail</span>
            </label>
          ) : null}
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
              <span>Mémoriser le mot de passe de connexion</span>
            </label>
          ) : null}
          {error ? <Alert>{error}</Alert> : null}
          <button className="btn btn-primary w-full" type="submit" disabled={pending}>
            {pending ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer le coffre"}
          </button>
          {mode === "login" ? (
            <button
              type="button"
              className="bio-btn"
              disabled={pending}
              aria-label="Connexion biométrique"
              onClick={() => void onBiometric()}
            >
              <BioMark />
            </button>
          ) : null}
          {mode === "login" && !bioSaved ? (
            <p className="text-sm text-muted">La première fois, saisissez l'e-mail et le mot de passe, puis ce bouton.</p>
          ) : null}
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
      </div>
    </main>
  );
}

function BioMark() {
  return <span className="bio-mark" aria-hidden="true" />;
}

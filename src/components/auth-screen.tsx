import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Alert, Brand, Field, SecretField, StrengthMeter } from "@/components/ui";
import {
  createVault,
  errorText,
  signInEmail,
  signInWithMaster,
  signUpEmail,
  unlockVault,
} from "@/lib/vault/actions";
import { countVaultUsers, getMeta } from "@/lib/vault/api";
import {
  clearBiometricLogin,
  openWithPrf,
  readBiometricLogin,
  registerBiometric,
  sealWithPrf,
  verifyBiometric,
  writeBiometricLogin,
} from "@/lib/vault/biometric";
import { setDek, writeDemoIds, clearRememberedLogin, readRememberedEmail, writeRememberedEmail, clearRememberedEmail } from "@/lib/vault/memory";
import { authSecret } from "@/lib/vault/secrets";

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
  const [rememberEmail, setRememberEmail] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  useEffect(() => {
    clearRememberedLogin();
    const savedEmail = readRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
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

  async function sealBiometric(
    address: string,
    credentialId: string,
    prf: Uint8Array | null,
    prfSalt: string,
    dek: CryptoKey | null,
    sessionSecret: string,
  ) {
    if (!prf || !dek) {
      writeBiometricLogin({ email: address, credentialId });
      setBioSaved(true);
      return;
    }
    const rawDek = new Uint8Array(await crypto.subtle.exportKey("raw", dek));
    writeBiometricLogin({
      email: address,
      credentialId,
      prfSalt,
      dekWrap: await sealWithPrf(prf, rawDek),
      authWrap: await sealWithPrf(prf, new TextEncoder().encode(sessionSecret)),
    });
    setBioSaved(true);
  }

  async function finishLogin(
    address: string,
    secret: string,
    biometric?: { credentialId: string; prf: Uint8Array | null; prfSalt: string } | null,
  ) {
    holdSession();
    const normalized = address.trim().toLowerCase();
    await signInWithMaster(normalized, secret);
    const meta = await getMeta();
    let dek: CryptoKey | null = null;
    if (meta) {
      try {
        dek = await unlockVault(secret, meta);
        setDek(dek);
      } catch {
        setDek(null);
      }
    }
    clearRememberedLogin();
    if (rememberEmail) writeRememberedEmail(normalized);
    else clearRememberedEmail();
    if (biometric) {
      if (biometric.prf && dek) {
        const sessionSecret = await authSecret(normalized, secret);
        await sealBiometric(normalized, biometric.credentialId, biometric.prf, biometric.prfSalt, dek, sessionSecret);
      } else if (!readBiometricLogin()?.dekWrap) {
        writeBiometricLogin({ email: normalized, credentialId: biometric.credentialId });
        setBioSaved(true);
      }
    } else if (biometric === null) {
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
        if (!saved.authWrap || !saved.dekWrap || !saved.prfSalt) {
          setError("Saisissez le mot de passe. L'empreinte de cet appareil ne garde plus le secret.");
          return;
        }
        const prf = await verifyBiometric(saved.credentialId, saved.prfSalt);
        if (!prf) {
          setError("Cet appareil ne peut pas ouvrir le coffre avec l'empreinte seule.");
          return;
        }
        const authBytes = await openWithPrf(prf, saved.authWrap);
        const sessionSecret = new TextDecoder().decode(authBytes);
        holdSession();
        await signInEmail(typed, sessionSecret);
        const raw = await openWithPrf(prf, saved.dekWrap);
        setDek(
          await crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]),
        );
        if (rememberEmail) writeRememberedEmail(typed);
        setPassword("");
        releaseSession();
        await navigate({ to: "/" });
        return;
      }
      const normalized = email.trim().toLowerCase();
      if (!normalized || !password) {
        setError("Saisissez l'e-mail et le mot de passe, puis appuyez de nouveau.");
        return;
      }
      const enrolled = await registerBiometric(normalized);
      await finishLogin(email, password, enrolled);
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
      const biometric =
        existing && existing.email === normalized
          ? { credentialId: existing.credentialId, prf: null, prfSalt: existing.prfSalt ?? "" }
          : undefined;
      await finishLogin(email, password, biometric);
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

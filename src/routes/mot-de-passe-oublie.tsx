import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert, Brand, Field, SecretField, StrengthMeter } from "@/components/ui";
import { errorText, resetWithRecovery } from "@/lib/vault/actions";
import { readRememberedLogin, writeRememberedLogin } from "@/lib/vault/memory";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCode(event: React.FormEvent) {
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
      const normalized = email.trim().toLowerCase();
      await resetWithRecovery(normalized, recoveryCode, password);
      const saved = readRememberedLogin();
      if (saved?.email === normalized) writeRememberedLogin(normalized, password);
      await navigate({ to: "/login" });
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="screen flex min-h-dvh max-w-lg flex-col justify-start sm:justify-center">
      <Brand subtitle="Mot de passe oublié" />
      <form className="mt-8 space-y-4" onSubmit={(event) => void onCode(event)}>
        <p className="text-sm text-muted">
          Saisissez le code remis à la création du coffre, puis un nouveau mot de passe. Il permet aussi de relire les comptes.
        </p>
        <Field label="Adresse e-mail">
          <input className="field" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Code de récupération">
          <input className="field secret" autoComplete="off" spellCheck={false} required value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} />
        </Field>
        <SecretField label="Nouveau mot de passe" value={password} onChange={setPassword} autoComplete="new-password" />
        <StrengthMeter password={password} />
        <SecretField label="Confirmer" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error ? <Alert>{error}</Alert> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={pending}>
          {pending ? "Vérification…" : "Réinitialiser"}
        </button>
      </form>
      <button type="button" className="mt-4 text-sm text-muted underline-offset-2 hover:underline" onClick={() => void navigate({ to: "/login" })}>
        Retour à la connexion
      </button>
    </main>
  );
}

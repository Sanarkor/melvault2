import { useState } from "react";
import { Alert, Dialog, Field, SecretField, StrengthMeter } from "@/components/ui";
import { generatePassword, type PasswordOptions } from "@/lib/vault/password";
import type { AccountFields } from "@/lib/vault/types";

const EMPTY: AccountFields = {
  service: "",
  category: "internet",
  username: "",
  email: "",
  password: "",
  phone: "",
  notes: "",
};

export function AccountDialog({
  initial,
  title,
  pending,
  categories,
  onClose,
  onSave,
}: {
  initial: AccountFields | null;
  title: string;
  pending: boolean;
  categories: { id: string; label: string }[];
  onClose: () => void;
  onSave: (fields: AccountFields) => void;
}) {
  const [fields, setFields] = useState<AccountFields>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [generator, setGenerator] = useState(false);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
  });
  const [generated, setGenerated] = useState("");

  function patch(partial: Partial<AccountFields>) {
    setFields((current) => ({ ...current, ...partial }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fields.service.trim()) {
      setError("Indiquez le nom du service.");
      return;
    }
    const category = categories.some((entry) => entry.id === fields.category)
      ? fields.category
      : (categories[0]?.id ?? "internet");
    onSave({ ...fields, service: fields.service.trim(), category });
  }

  function makePassword() {
    try {
      setGenerated(generatePassword(options));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Génération impossible.");
    }
  }

  const choices =
    fields.category && !categories.some((entry) => entry.id === fields.category)
      ? [{ id: fields.category, label: fields.category }, ...categories]
      : categories;

  return (
    <Dialog title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <button type="button" className="btn-quiet" onClick={onClose}>
            Fermer
          </button>
        </div>
        <Field label="Nom du service">
          <input
            className="field"
            value={fields.service}
            required
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => patch({ service: event.target.value })}
          />
        </Field>
        <Field label="Catégorie">
          <select
            className="field"
            value={fields.category}
            onChange={(event) => patch({ category: event.target.value })}
          >
            {choices.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Identifiant">
          <input
            className="field"
            value={fields.username}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            onChange={(event) => patch({ username: event.target.value })}
          />
        </Field>
        <Field label="Adresse e-mail">
          <input
            className="field"
            type="email"
            value={fields.email}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => patch({ email: event.target.value })}
          />
        </Field>
        <SecretField
          label="Mot de passe"
          value={fields.password}
          autoComplete="new-password"
          onChange={(password) => patch({ password })}
        />
        <StrengthMeter password={fields.password} />
        <button type="button" className="btn-quiet" onClick={() => setGenerator((open) => !open)}>
          {generator ? "Fermer le générateur" : "Générer un mot de passe"}
        </button>
        {generator ? (
          <div className="space-y-3 rounded-control border border-line bg-surface-2 p-3">
            <Field label={`Longueur : ${options.length}`}>
              <input
                className="w-full"
                type="range"
                min={12}
                max={48}
                value={options.length}
                onChange={(event) => setOptions((current) => ({ ...current, length: Number(event.target.value) }))}
              />
            </Field>
            {(
              [
                ["upper", "Majuscules"],
                ["lower", "Minuscules"],
                ["digits", "Chiffres"],
                ["symbols", "Caractères spéciaux"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
                />
                {label}
              </label>
            ))}
            {generated ? <StrengthMeter password={generated} /> : null}
            {generated ? <p className="secret break-all rounded-control bg-surface px-3 py-2 text-sm">{generated}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary" onClick={makePassword}>
                Générer
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!generated}
                onClick={() => {
                  if (!generated) return;
                  void navigator.clipboard.writeText(generated).then(
                    () => setError(null),
                    () => setError("Copie impossible."),
                  );
                }}
              >
                Copier
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!generated}
                onClick={() => {
                  if (!generated) return;
                  patch({ password: generated });
                  setGenerator(false);
                }}
              >
                Utiliser ce mot de passe
              </button>
            </div>
          </div>
        ) : null}
        <Field label="Téléphone">
          <input
            className="field"
            value={fields.phone}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </Field>
        <Field label="Notes">
          <textarea
            className="field"
            value={fields.notes}
            spellCheck={false}
            onChange={(event) => patch({ notes: event.target.value })}
          />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </Dialog>
  );
}

import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { strengthOf } from "@/lib/vault/password";
import { applyTheme, readTheme, type ThemeName } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    const current = readTheme();
    setTheme(current);
    applyTheme(current);
  }, []);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="corner-btn theme-toggle"
      aria-label={next === "light" ? "Mode clair" : "Mode sombre"}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}

export function Mark({ large = false }: { large?: boolean }) {
  return (
    <img
      src="/icon-192.png"
      alt=""
      width={large ? 128 : 44}
      height={large ? 128 : 44}
      className={large ? "mark mark-lg" : "mark"}
    />
  );
}

export function Brand({ subtitle, large = false }: { subtitle?: string; large?: boolean }) {
  return (
    <div className={large ? "brand brand-lg" : "brand"}>
      <Mark large={large} />
      {large ? (
        subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null
      ) : (
        <div className="min-w-0">
          <p className="vault-word">MELVAULT</p>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <Brand />
      <div className="h-11 animate-pulse rounded-control bg-line" />
      <div className="card h-28 animate-pulse" />
      <div className="card h-28 animate-pulse" />
    </main>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function SecretField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="field pr-12"
          type={shown ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="icon-btn absolute top-1 right-1"
          aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setShown((current) => !current)}
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const strength = strengthOf(password);
  const tone =
    strength.score === 0 ? "bg-danger" : strength.score === 1 ? "bg-subtle" : "bg-ok";
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${index <= strength.score ? tone : "bg-line"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">Force : {strength.label}</p>
    </div>
  );
}

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="modal-root" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-control border border-line bg-surface-2 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

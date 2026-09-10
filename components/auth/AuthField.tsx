"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole, type LucideIcon } from "lucide-react";

export function AuthField({
  label,
  htmlFor,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: LucideIcon;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-bold text-muted">
        {label}
      </label>
      <span className="relative block">
        <Icon size={17} aria-hidden="true" className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        {children}
      </span>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  error,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField label={label} htmlFor={id} icon={LockKeyhole} error={error}>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={8}
        required
        placeholder={placeholder}
        className="auth-input auth-input-with-action"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white hover:text-ink"
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </AuthField>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return <span className="mt-1.5 block text-xs font-medium text-danger">{children}</span>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
};

type AuthBannerProps = {
  children: ReactNode;
  tone?: "error" | "info" | "success";
};

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
  revealable?: boolean;
};

const toneClasses: Record<NonNullable<AuthBannerProps["tone"]>, string> = {
  error:
    "border-rose-200 bg-rose-50/90 text-rose-900 shadow-[0_18px_45px_rgba(244,63,94,0.08)]",
  info: "border-stone-200 bg-white/85 text-stone-700 shadow-sm",
  success:
    "border-emerald-200 bg-emerald-50/90 text-emerald-900 shadow-[0_18px_45px_rgba(16,185,129,0.08)]",
};

export function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-stone-900/10 bg-white/86 p-6 shadow-[0_30px_90px_rgba(68,48,22,0.12)] backdrop-blur sm:p-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
          Account Access
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>

      <div className="mt-8 space-y-5">{children}</div>

      {footer ? <div className="mt-6 text-sm text-stone-600">{footer}</div> : null}
    </div>
  );
}

export function AuthBanner({ children, tone = "info" }: AuthBannerProps) {
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", toneClasses[tone])}>
      {children}
    </div>
  );
}

export function AuthInput({ className, error, label, revealable, type, ...props }: AuthInputProps) {
  const [revealed, setRevealed] = useState(false);

  const inputType = type === "password" && revealable ? (revealed ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="relative mt-2">
        <input
          className={cn(
            "w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white",
            error ? "border-rose-300 bg-rose-50/80" : null,
            className,
          )}
          type={inputType}
          {...props}
        />

        {type === "password" && revealable ? (
          <button
            type="button"
            onClick={() => setRevealed((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-600 hover:text-stone-900"
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>

      {error ? <span className="text-sm text-rose-700 mt-2 block">{error}</span> : null}
    </label>
  );
}

export function AuthLinkRow({
  href,
  label,
  linkLabel,
}: {
  href: string;
  label: string;
  linkLabel: string;
}) {
  return (
    <p className="text-sm text-stone-600">
      {label}{" "}
      <Link className="font-semibold text-stone-950 hover:text-[color:var(--color-primary)]" href={href}>
        {linkLabel}
      </Link>
    </p>
  );
}

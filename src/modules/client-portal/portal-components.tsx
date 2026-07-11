"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import Link from "next/link";
import { cn } from "@/utils";

type PortalPageHeaderProps = {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PortalPageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PortalPageHeaderProps) {
  return (
    <header className="rounded-[1.75rem] border border-[#d7d0c4] bg-[#fff9f0] px-6 py-6 shadow-[0_24px_80px_rgba(74,58,34,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a5a1f]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="font-[family:var(--font-display)] text-[2rem] font-semibold uppercase tracking-[0.04em] text-[#302016] sm:text-[2.35rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-4xl text-sm leading-7 text-[#6f6256]">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

type PortalPanelProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function PortalPanel({ children, className, title }: PortalPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-[#ddd4c9] bg-white/95 p-5 shadow-[0_20px_60px_rgba(58,44,26,0.08)]",
        className,
      )}
    >
      {title ? (
        <h2 className="mb-4 font-[family:var(--font-display)] text-[1.35rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

type PortalStatProps = {
  description: string;
  href?: string;
  label: string;
  value: string | number;
};

export function PortalStat({ description, href, label, value }: PortalStatProps) {
  const content = (
    <article className="rounded-[1.4rem] border border-[#e3dacd] bg-[#fffdfa] p-5 shadow-[0_16px_50px_rgba(74,58,34,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a5a1f]">{label}</p>
      <p className="mt-3 font-[family:var(--font-display)] text-[2.2rem] font-semibold uppercase tracking-[0.03em] text-[#2f2217]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#6f6256]">{description}</p>
      {href ? <p className="mt-5 text-sm font-semibold text-[#9a5b1b]">Ver detalle</p> : null}
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function PortalActionButton({
  children,
  className,
  href,
  onClick,
  tone = "primario",
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: "primario" | "secundario" | "suave";
  type?: "button" | "submit";
}) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition",
    tone === "primario" &&
      "bg-[#0f5bd7] text-white hover:bg-[#0b4ab3]",
    tone === "secundario" &&
      "border border-[#d7d0c4] bg-white text-[#302016] hover:bg-[#f8f2e8]",
    tone === "suave" &&
      "bg-[#f7ead6] text-[#8a5a1f] hover:bg-[#efdfc5]",
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export function PortalStatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "alerta" | "exito" | "neutral" | "pendiente";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "neutral" && "bg-[#f5efe4] text-[#6d5b47]",
        tone === "exito" && "bg-[#e5f5ec] text-[#1e7a4d]",
        tone === "alerta" && "bg-[#fde8e3] text-[#b6452c]",
        tone === "pendiente" && "bg-[#fff2d9] text-[#9a5b1b]",
      )}
    >
      {children}
    </span>
  );
}

export function PortalField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">{label}</p>
      <div className="text-sm leading-6 text-[#302016]">{children}</div>
    </div>
  );
}

export function PortalNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "exito" | "info";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.15rem] border px-4 py-3 text-sm leading-6",
        tone === "info" && "border-[#ddd4c9] bg-[#fff9f0] text-[#6f6256]",
        tone === "exito" && "border-[#d4ead8] bg-[#eef8f0] text-[#1e7a4d]",
        tone === "error" && "border-[#f3d4ca] bg-[#fff1eb] text-[#a53a22]",
      )}
    >
      {children}
    </div>
  );
}

export function PortalInput({
  className,
  error,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
        {label}
      </span>
      <input
        className={cn(
          "w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016] outline-none transition focus:border-[#0f5bd7] focus:bg-white",
          error ? "border-[#d86b50] bg-[#fff2ec]" : null,
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-[#b6452c]">{error}</p> : null}
    </label>
  );
}

export function PortalSelect({
  children,
  className,
  error,
  label,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
        {label}
      </span>
      <select
        className={cn(
          "w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016] outline-none transition focus:border-[#0f5bd7] focus:bg-white",
          error ? "border-[#d86b50] bg-[#fff2ec]" : null,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-[#b6452c]">{error}</p> : null}
    </label>
  );
}

export function PortalTextarea({
  className,
  error,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
        {label}
      </span>
      <textarea
        className={cn(
          "min-h-32 w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016] outline-none transition focus:border-[#0f5bd7] focus:bg-white",
          error ? "border-[#d86b50] bg-[#fff2ec]" : null,
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-[#b6452c]">{error}</p> : null}
    </label>
  );
}

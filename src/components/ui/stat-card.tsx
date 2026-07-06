import type { ComponentType } from "react";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/utils";

type StatCardProps = {
  description: string;
  href?: string;
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  tone?: "accent" | "default";
  value: string;
};

export function StatCard({
  description,
  href,
  icon: Icon,
  label,
  tone = "default",
  value,
}: StatCardProps) {
  const content = (
    <article
      className={cn(
        "group rounded-md border px-4 py-4 shadow-sm transition duration-200",
        tone === "accent"
          ? "border-[rgba(15,91,215,0.24)] bg-[linear-gradient(180deg,var(--color-surface)_0%,#f4f8ff_100%)] text-[color:var(--color-text)]"
          : "border-[color:var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              {label}
            </p>
            {tone === "accent" ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            ) : null}
          </div>
          <p className="font-[family:var(--font-display)] text-[2.2rem] font-semibold uppercase tracking-[0.04em] text-[color:var(--color-text)]">
            {value}
          </p>
          <p className="max-w-[28ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "rounded-md border p-2.5",
            tone === "accent"
              ? "border-[rgba(15,91,215,0.16)] bg-[var(--color-primary-soft)] text-[color:var(--color-primary-soft-text)]"
              : "border-[color:var(--color-border)] bg-[var(--color-surface-muted)] text-[color:var(--color-primary)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {href ? (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-primary-soft-text)]",
          )}
        >
          Abrir modulo
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="block" href={href}>
      {content}
    </Link>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-2.5 w-24 rounded-md bg-[var(--color-surface-strong)]" />
        <div className="h-10 w-28 rounded-md bg-[var(--color-surface-strong)]" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-3 w-3/4 rounded-md bg-[var(--color-surface-strong)]" />
        </div>
      </div>
    </div>
  );
}

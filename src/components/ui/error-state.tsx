"use client";

import type { ReactNode } from "react";

import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
};

export function ErrorState({
  action,
  description,
  title,
}: ErrorStateProps) {
  return (
    <section className="rounded-md border border-rose-200/90 bg-[color:oklch(0.985_0.01_25)] px-6 py-8 text-center shadow-sm sm:px-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div className="rounded-md border border-rose-200 bg-[var(--color-error)] p-3 text-[color:var(--color-primary-contrast)]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-3">
          <h2 className="font-[family:var(--font-display)] text-[1.6rem] font-semibold uppercase tracking-[0.04em] text-[color:var(--color-text)]">
            {title}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-muted)]">
            {description}
          </p>
        </div>
        {action ? <div className="flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </section>
  );
}

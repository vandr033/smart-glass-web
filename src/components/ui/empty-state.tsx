import type { ComponentType, ReactNode } from "react";

import { Inbox } from "lucide-react";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ComponentType<{
    className?: string;
  }>;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon: Icon = Inbox,
  title,
}: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center shadow-sm sm:px-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-[color:var(--color-primary)]">
          <Icon className="h-6 w-6" />
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

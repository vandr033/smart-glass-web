import type { ReactNode } from "react";

import { cn } from "@/utils";

type PageHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-md border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-sm sm:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <h1 className="font-[family:var(--font-display)] text-[2rem] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text)] sm:text-[2.2rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-4xl text-sm leading-6 text-[color:var(--color-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </header>
  );
}

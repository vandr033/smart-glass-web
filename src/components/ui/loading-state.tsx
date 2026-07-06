import { StatCardSkeleton } from "@/components/ui/stat-card";

type LoadingStateProps = {
  cards?: number;
  title?: string;
};

export function LoadingState({
  cards = 4,
  title = "Cargando area de trabajo",
}: LoadingStateProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-6 shadow-sm sm:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-28 rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-10 w-56 rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-4 w-full max-w-2xl rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-4 w-3/4 max-w-xl rounded-md bg-[var(--color-surface-strong)]" />
        </div>
        <p className="mt-5 text-sm font-medium text-[color:var(--color-text-muted)]">{title}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </section>

      <section className="rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-4 w-full rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-4 w-5/6 rounded-md bg-[var(--color-surface-strong)]" />
          <div className="h-32 rounded-md bg-[var(--color-surface-strong)]" />
        </div>
      </section>
    </div>
  );
}

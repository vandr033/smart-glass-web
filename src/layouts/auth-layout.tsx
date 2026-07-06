import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eaf3ff_100%)] px-6 py-10 text-stone-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_minmax(0,34rem)]">
        <section className="flex flex-col justify-between rounded-lg border border-stone-900/10 bg-[var(--color-primary)] px-8 py-10 text-stone-50 shadow-[0_30px_90px_rgba(15,47,91,0.18)]">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
              Smart Glass Bolivia
            </p>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
              Soluciones en vidrio inteligente para Bolivia.
            </h1>
            <p className="max-w-lg text-base leading-7 text-stone-300">
              Gestion integral de operaciones comerciales, produccion, compras e
              inventario para Smart Glass Bolivia.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/6 p-4">
              Control de proyectos, cotizaciones y clientes en una sola plataforma.
            </div>
            <div className="rounded-lg border border-white/10 bg-white/6 p-4">
              Seguimiento de inventario, compras y produccion en tiempo real.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>
    </main>
  );
}

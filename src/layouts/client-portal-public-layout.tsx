import type { ReactNode } from "react";

type ClientPortalPublicLayoutProps = {
  children: ReactNode;
};

export function ClientPortalPublicLayout({
  children,
}: ClientPortalPublicLayoutProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_28%),radial-gradient(circle_at_bottom_right,#f6d8ae,transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6efe5_100%)] px-5 py-8 text-[#302016] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-8 lg:grid-cols-[1.08fr_minmax(0,34rem)]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/35 bg-[linear-gradient(180deg,#0f4ca8_0%,#0f5bd7_42%,#f3b86b_160%)] px-8 py-8 text-white shadow-[0_30px_90px_rgba(15,76,168,0.24)] sm:px-10 sm:py-10">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-50">
              Vidriera Sebitas ERP
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-[family:var(--font-display)] text-4xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">
                Portal del Cliente
              </h1>
              <p className="max-w-2xl text-base leading-8 text-blue-50/90">
                Consulta cotizaciones, proyectos, instalaciones, documentos,
                garantias y casos postventa desde un acceso externo seguro y
                pensado para acompanarte durante todo el proceso.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-blue-50/92 sm:grid-cols-2">
            <div className="rounded-[1.3rem] border border-white/15 bg-white/8 p-4">
              Vista separada del equipo interno para proteger costos, margenes
              y datos operativos.
            </div>
            <div className="rounded-[1.3rem] border border-white/15 bg-white/8 p-4">
              Descarga documentos comerciales y seguimiento claro de cada etapa
              del proyecto.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>
    </main>
  );
}

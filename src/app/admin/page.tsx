import {
  Boxes,
  FileSearch,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatModuleLabel } from "@/lib/formatters";
import { getServerCurrentUser, requireAuth } from "@/lib/server-auth";
import { ProjectDashboardCards } from "@/modules/projects/components/ProjectDashboardCards";

export default async function AdminDashboardPage() {
  await requireAuth();
  const currentUser = await getServerCurrentUser();

  if (!currentUser) {
    return null;
  }

  const visibleBusinessModules = currentUser.enabledModules.filter(
    (moduleItem) =>
      !["dashboard", "settings", "audit-log"].includes(moduleItem.key),
  );

  return (
    <main className="space-y-6">
      <PageHeader
        description={`Bienvenido, ${currentUser.user.name}. Este centro operativo concentra accesos, configuracion y visibilidad comercial para que el ERP avance con una sola interfaz de trabajo.`}
        eyebrow="Panel principal"
        title="Centro ERP"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Modulos habilitados para esta cuenta dentro del entorno operativo actual."
          href="/admin"
          icon={LayoutDashboard}
          label="Modulos activos"
          tone="accent"
          value={String(currentUser.enabledModules.length)}
        />
        <StatCard
          description="Revisa accesos y asignaciones criticas desde la matriz de permisos."
          href="/admin/roles"
          icon={ShieldCheck}
          label="Roles y permisos"
          value={currentUser.permissions.includes("system.roles.read") ? "Habilitado" : "Restringido"}
        />
        <StatCard
          description="Administra claves operativas y ajustes compartidos del ERP industrial."
          href="/admin/settings"
          icon={Settings}
          label="Configuracion"
          value={currentUser.permissions.includes("system.settings.read") ? "Disponible" : "Solo lectura"}
        />
        <StatCard
          description="Consulta trazabilidad de cambios y revisiones sobre configuracion sensible."
          href="/admin/audit-log"
          icon={FileSearch}
          label="Auditoria"
          value={currentUser.permissions.includes("system.audit.read") ? "Visible" : "Oculta"}
        />
      </section>

      {currentUser.permissions.includes("projects.read") ? <ProjectDashboardCards /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-md border border-[color:var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Registro operativo
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visibleBusinessModules.map((moduleItem) => (
              <div
                key={moduleItem.key}
                className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[color:var(--color-text)]">
                  {formatModuleLabel(moduleItem.label)}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
                  Acceso habilitado para el frente de{" "}
                  {formatModuleLabel(moduleItem.label).toLowerCase()}.
                </p>
                <p className="mt-3 font-mono text-xs text-[color:var(--color-text-subtle)]">
                  {moduleItem.route}
                </p>
              </div>
            ))}
          </div>
        </section>

        <EmptyState
          description="Las siguientes etapas del ERP se seguiran consolidando sobre clientes, proyectos, compras, inventario y produccion ya habilitados en esta misma estructura."
          icon={Boxes}
          title="Crecimiento por etapas"
        />
      </section>
    </main>
  );
}

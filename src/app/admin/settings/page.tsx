import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { sectionClassName, secondaryButtonClassName } from "@/modules/commercial/ui";
import { SystemSettingsManager } from "@/modules/admin/system-settings-manager";

export default async function AdminSettingsPage() {
  const authorization = await requirePermission("system.settings.read");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            {authorization.permissions.includes("suppliers.read") ? (
              <Link
                className={secondaryButtonClassName}
                href="/admin/settings/supplier-categories"
              >
                Categorias de proveedores
              </Link>
            ) : null}
            {authorization.permissions.includes("inventory.read") ? (
              <Link className={secondaryButtonClassName} href="/admin/inventory/warehouses">
                Almacenes
              </Link>
            ) : null}
            {authorization.permissions.includes("suppliers.read") ? (
              <Link
                className={secondaryButtonClassName}
                href="/admin/settings/supplier-scoring"
              >
                Puntajes de proveedor
              </Link>
            ) : null}
          </>
        }
        description="Administra ajustes compartidos y parametros operativos que sostienen modulos comerciales, compras y trazabilidad."
        eyebrow="Configuracion"
        title="Configuracion del sistema"
      />

      <section className={sectionClassName}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
          Ubicaciones operativas
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">Almacenes y centros de operación</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-700">
              Administra los almacenes que se usan para existencias, traslados, reservas,
              remanentes y recepciones de compra.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600">
              Sucursales todavía no existe como catálogo independiente en el modelo actual;
              el indicador superior muestra la sucursal activa de la interfaz.
            </p>
          </div>
          {authorization.permissions.includes("inventory.read") ? (
            <Link className={secondaryButtonClassName} href="/admin/inventory/warehouses">
              Administrar almacenes
            </Link>
          ) : null}
        </div>
      </section>

      <SystemSettingsManager />
    </main>
  );
}

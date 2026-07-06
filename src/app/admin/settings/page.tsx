import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { secondaryButtonClassName } from "@/modules/commercial/ui";
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

      <SystemSettingsManager />
    </main>
  );
}

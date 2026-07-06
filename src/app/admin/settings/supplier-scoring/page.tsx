import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requireAllPermissions } from "@/lib/server-auth";
import { secondaryButtonClassName } from "@/modules/commercial/ui";
import { SupplierScoringManager } from "@/modules/suppliers/components/SupplierScoringManager";

export default async function AdminSupplierScoringPage() {
  await requireAllPermissions(["system.settings.read", "suppliers.read"]);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link
            className={secondaryButtonClassName}
            href="/admin/settings/supplier-categories"
          >
            Gestionar categorias
          </Link>
        }
        description="Configura pesos de evaluacion, revisa reglas activas y simula comparativos antes de compras o listas de precios."
        eyebrow="Configuracion"
        title="Puntajes de proveedor"
      />

      <SupplierScoringManager />
    </main>
  );
}

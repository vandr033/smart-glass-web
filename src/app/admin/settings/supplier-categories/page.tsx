import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requireAllPermissions } from "@/lib/server-auth";
import { secondaryButtonClassName } from "@/modules/commercial/ui";
import { SupplierCategoriesManager } from "@/modules/suppliers/components/SupplierCategoriesManager";

export default async function AdminSupplierCategoriesPage() {
  await requireAllPermissions(["system.settings.read", "suppliers.read"]);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link
            className={secondaryButtonClassName}
            href="/admin/settings/supplier-scoring"
          >
            Abrir configuracion de puntajes
          </Link>
        }
        description="Mantiene una taxonomia estable para clasificar proveedores y reutilizar reglas de puntaje por categoria."
        eyebrow="Configuracion"
        title="Categorias de proveedores"
      />

      <SupplierCategoriesManager />
    </main>
  );
}

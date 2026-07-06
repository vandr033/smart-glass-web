import { PageHeader } from "@/components/ui/page-header";

import { SupplierMaterialEquivalencesManager } from "../components/SupplierMaterialEquivalencesManager";

export default function SupplierMaterialEquivalencesPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa mapeos pendientes, valida coincidencias internas y mantiene los niveles de confianza."
        eyebrow="Mapeo"
        title="Equivalencias de materiales de proveedor"
      />

      <SupplierMaterialEquivalencesManager />
    </main>
  );
}

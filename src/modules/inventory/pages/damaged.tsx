import { PageHeader } from "@/components/ui/page-header";

import { DamagedMaterialsTable } from "../components/DamagedMaterialsTable";

export default function InventoryDamagedPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa reportes de material danado, clasifica su reutilizacion, desecha lo no utilizable o devuelve material a proveedores sin perder trazabilidad."
        eyebrow="Operaciones"
        title="Material danado"
      />

      <DamagedMaterialsTable />
    </main>
  );
}

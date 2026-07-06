import { PageHeader } from "@/components/ui/page-header";

import { InventoryRemnantsTable } from "../components/InventoryRemnantsTable";

export default function InventoryRemnantsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Busca remanentes reutilizables por tamano y espesor, monitorea su estado y manten visible el vidrio sobrante para futuras optimizaciones de corte."
        eyebrow="Operaciones"
        title="Remanentes"
      />

      <InventoryRemnantsTable />
    </main>
  );
}

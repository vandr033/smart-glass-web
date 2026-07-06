import { PageHeader } from "@/components/ui/page-header";

import { WarehouseManager } from "../components/WarehouseManager";

export default function InventoryWarehousesPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea y mantiene almacenes para ingresos, traslados, remanentes, reservas y seguimiento de material danado."
        eyebrow="Operaciones"
        title="Almacenes"
      />

      <WarehouseManager />
    </main>
  );
}

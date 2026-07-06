import { PageHeader } from "@/components/ui/page-header";

import { InventoryMovementsTable } from "../components/InventoryMovementsTable";

export default function InventoryMovementsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Inspecciona el libro de movimientos generado por ingresos, traslados, reservas, danos y desechos."
        eyebrow="Operaciones"
        title="Movimientos de inventario"
      />

      <InventoryMovementsTable />
    </main>
  );
}

import { PageHeader } from "@/components/ui/page-header";

import { InventoryReservationsTable } from "../components/InventoryReservationsTable";

export default function InventoryReservationsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Da seguimiento a reservas blandas y firmes, vinculalas con cotizaciones o proyectos y liberarlas o consumirlas segun evolucione el compromiso."
        eyebrow="Operaciones"
        title="Reservas de inventario"
      />

      <InventoryReservationsTable />
    </main>
  );
}

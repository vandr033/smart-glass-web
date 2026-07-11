import { PageHeader } from "@/components/ui/page-header";

import { StockEntryForm } from "../components/StockEntryForm";

export default function NewStockEntryPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Registra una nueva fila de existencias con almacén, material, dimensiones, lote y metadatos de origen correctos."
        eyebrow="Operaciones"
        title="Nuevo ingreso de existencias"
      />

      <StockEntryForm />
    </main>
  );
}

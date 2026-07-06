import { PageHeader } from "@/components/ui/page-header";

import { QuotationForm } from "../components/QuotationForm";

export default function CreateQuotationPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea primero la cabecera de la cotizacion y luego pasa al constructor para agregar lineas comerciales."
        eyebrow="Crear cotizacion"
        title="Nueva cotizacion"
      />

      <QuotationForm mode="create" />
    </main>
  );
}

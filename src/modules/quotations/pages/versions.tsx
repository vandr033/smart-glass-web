import { PageHeader } from "@/components/ui/page-header";

import { QuotationVersionsList } from "../components/QuotationVersionsList";

type QuotationVersionsPageProps = {
  quotationId: string;
};

export default function QuotationVersionsPage({
  quotationId,
}: QuotationVersionsPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa los snapshots para conservar el estado comercial exacto de cada hito de la cotizacion."
        eyebrow="Versiones de cotizacion"
        title="Historial de versiones"
      />

      <QuotationVersionsList quotationId={quotationId} />
    </main>
  );
}

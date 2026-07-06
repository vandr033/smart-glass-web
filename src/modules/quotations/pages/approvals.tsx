import { PageHeader } from "@/components/ui/page-header";

import { QuotationApprovalTable } from "../components/QuotationApprovalTable";

export default function QuotationApprovalsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa aprobaciones comerciales activadas por margenes bajos, descuentos altos o revisiones manuales."
        eyebrow="Cotizaciones"
        title="Cola de aprobaciones"
      />

      <QuotationApprovalTable />
    </main>
  );
}

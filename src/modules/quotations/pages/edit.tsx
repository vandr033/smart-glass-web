import { PageHeader } from "@/components/ui/page-header";

import { QuotationForm } from "../components/QuotationForm";

type EditQuotationPageProps = {
  quotationId: string;
};

export default function EditQuotationPage({
  quotationId,
}: EditQuotationPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualiza cabecera, vigencia y notas comerciales sin alterar los calculos versionados de items."
        eyebrow="Editar cotizacion"
        title="Editar cotizacion"
      />

      <QuotationForm mode="edit" quotationId={quotationId} />
    </main>
  );
}

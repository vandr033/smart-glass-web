import { requirePermission } from "@/lib/server-auth";
import EditQuotationPage from "@/modules/quotations/pages/edit";

type EditQuotationRoutePageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function EditQuotationRoutePage({
  params,
}: EditQuotationRoutePageProps) {
  await requirePermission("quotations.update");

  const { quotationId } = await params;

  return <EditQuotationPage quotationId={quotationId} />;
}

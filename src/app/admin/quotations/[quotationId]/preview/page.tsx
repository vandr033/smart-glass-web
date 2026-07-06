import { requirePermission } from "@/lib/server-auth";
import QuotationPreviewPage from "@/modules/quotations/pages/preview";

type QuotationPreviewRoutePageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationPreviewRoutePage({
  params,
}: QuotationPreviewRoutePageProps) {
  await requirePermission("quotations.read");

  const { quotationId } = await params;

  return <QuotationPreviewPage quotationId={quotationId} />;
}

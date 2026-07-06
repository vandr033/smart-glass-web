import { requirePermission } from "@/lib/server-auth";
import QuotationViewPage from "@/modules/quotations/pages/view";

type QuotationRoutePageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationRoutePage({
  params,
}: QuotationRoutePageProps) {
  await requirePermission("quotations.read");

  const { quotationId } = await params;

  return <QuotationViewPage quotationId={quotationId} />;
}

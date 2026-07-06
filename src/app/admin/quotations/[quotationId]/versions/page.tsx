import { requirePermission } from "@/lib/server-auth";
import QuotationVersionsPage from "@/modules/quotations/pages/versions";

type QuotationVersionsRoutePageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationVersionsRoutePage({
  params,
}: QuotationVersionsRoutePageProps) {
  await requirePermission("quotations.read");

  const { quotationId } = await params;

  return <QuotationVersionsPage quotationId={quotationId} />;
}

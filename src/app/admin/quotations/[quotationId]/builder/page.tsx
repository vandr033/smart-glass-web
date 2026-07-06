import { requirePermission } from "@/lib/server-auth";
import QuotationBuilderPage from "@/modules/quotations/pages/builder";

type QuotationBuilderRoutePageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function QuotationBuilderRoutePage({
  params,
}: QuotationBuilderRoutePageProps) {
  await requirePermission("quotations.update");

  const { quotationId } = await params;

  return <QuotationBuilderPage quotationId={quotationId} />;
}

import { PortalQuotationDetailPage } from "@/modules/client-portal/portal-pages";

export default async function PortalClienteCotizacionDetallePage({
  params,
}: {
  params: Promise<{
    quotationId: string;
  }>;
}) {
  const { quotationId } = await params;

  return <PortalQuotationDetailPage quotationId={quotationId} />;
}

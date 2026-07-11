import { PortalInstallationDetailPage } from "@/modules/client-portal/portal-pages";

export default async function PortalClienteInstalacionDetallePage({
  params,
}: {
  params: Promise<{
    orderId: string;
  }>;
}) {
  const { orderId } = await params;

  return <PortalInstallationDetailPage orderId={orderId} />;
}

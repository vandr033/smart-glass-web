import { PortalPostventaDetailPage } from "@/modules/client-portal/portal-pages";

export default async function PortalClientePostventaDetallePage({
  params,
}: {
  params: Promise<{
    caseId: string;
  }>;
}) {
  const { caseId } = await params;

  return <PortalPostventaDetailPage caseId={caseId} />;
}

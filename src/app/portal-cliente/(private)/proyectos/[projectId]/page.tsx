import { PortalProjectDetailPage } from "@/modules/client-portal/portal-pages";

export default async function PortalClienteProyectoDetallePage({
  params,
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const { projectId } = await params;

  return <PortalProjectDetailPage projectId={projectId} />;
}

import { requirePermission } from "@/lib/server-auth";
import RentabilidadDetailPage from "@/modules/project-profitability/pages/detail";

type RentabilidadDetailRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function RentabilidadDetailRoute({
  params,
}: RentabilidadDetailRouteProps) {
  const { projectId } = await params;
  await requirePermission("rentabilidad.analizar");

  return <RentabilidadDetailPage projectId={projectId} />;
}

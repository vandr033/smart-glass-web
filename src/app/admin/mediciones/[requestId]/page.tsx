import { requirePermission } from "@/lib/server-auth";
import MeasurementsDetailPage from "@/modules/measurements/pages/detail";

type MeasurementsDetailRoutePageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function MeasurementsDetailRoutePage({
  params,
}: MeasurementsDetailRoutePageProps) {
  await requirePermission("mediciones.ver");

  const { requestId } = await params;

  return <MeasurementsDetailPage requestId={requestId} />;
}

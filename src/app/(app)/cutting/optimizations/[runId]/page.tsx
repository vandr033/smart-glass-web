import { requirePermission } from "@/lib/server-auth";
import CuttingOptimizationDetailPage from "@/modules/cutting/pages/optimization-detail";

export default async function CuttingOptimizationDetailRoute({
  params,
}: {
  params: Promise<{
    runId: string;
  }>;
}) {
  await requirePermission("cutting.read");
  const { runId } = await params;

  return <CuttingOptimizationDetailPage runId={runId} />;
}

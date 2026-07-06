import { requirePermission } from "@/lib/server-auth";
import CuttingPlanDetailPage from "@/modules/cutting/pages/plan-detail";

export default async function CuttingPlanDetailRoute({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  await requirePermission("cutting.read");
  const { planId } = await params;

  return <CuttingPlanDetailPage planId={planId} />;
}

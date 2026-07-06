import { requirePermission } from "@/lib/server-auth";
import CuttingPlanPrintPage from "@/modules/cutting/pages/plan-print";

export default async function CuttingPlanPrintRoute({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  await requirePermission("cutting.print");
  const { planId } = await params;

  return <CuttingPlanPrintPage planId={planId} />;
}

import { requirePermission } from "@/lib/server-auth";
import ProfileCuttingPlanPrintPage from "@/modules/profile-optimization/pages/plan-print";

export default async function ProfileCuttingPlanPrintRoute({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  await requirePermission("cutting.print");
  const { planId } = await params;

  return <ProfileCuttingPlanPrintPage planId={planId} />;
}

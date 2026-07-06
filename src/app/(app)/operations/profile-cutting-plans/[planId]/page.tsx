import { requirePermission } from "@/lib/server-auth";
import ProfileCuttingPlanDetailPage from "@/modules/profile-optimization/pages/plan-detail";

export default async function ProfileCuttingPlanDetailRoute({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  await requirePermission("cutting.read");
  const { planId } = await params;

  return <ProfileCuttingPlanDetailPage planId={planId} />;
}

import { requirePermission } from "@/lib/server-auth";
import ProfileOptimizationDetailPage from "@/modules/profile-optimization/pages/optimization-detail";

export default async function ProfileOptimizationDetailRoute({
  params,
}: {
  params: Promise<{
    runId: string;
  }>;
}) {
  await requirePermission("cutting.read");
  const { runId } = await params;

  return <ProfileOptimizationDetailPage runId={runId} />;
}

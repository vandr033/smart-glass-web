import { requirePermission } from "@/lib/server-auth";
import ProductionJobTasksPage from "@/modules/production/pages/job-tasks";

type ProductionJobTasksRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ProductionJobTasksRoutePage({
  params,
}: ProductionJobTasksRouteProps) {
  await requirePermission("production.read");

  const { jobId } = await params;

  return <ProductionJobTasksPage jobId={jobId} />;
}

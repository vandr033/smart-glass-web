import { requirePermission } from "@/lib/server-auth";
import ProductionJobDetailPage from "@/modules/production/pages/job-detail";

type ProductionJobDetailRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ProductionJobDetailRoutePage({
  params,
}: ProductionJobDetailRouteProps) {
  await requirePermission("production.read");

  const { jobId } = await params;

  return <ProductionJobDetailPage jobId={jobId} />;
}

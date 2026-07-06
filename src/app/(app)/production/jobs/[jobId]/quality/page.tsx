import { requirePermission } from "@/lib/server-auth";
import ProductionJobQualityPage from "@/modules/production/pages/job-quality";

type ProductionJobQualityRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ProductionJobQualityRoutePage({
  params,
}: ProductionJobQualityRouteProps) {
  await requirePermission("production.read");

  const { jobId } = await params;

  return <ProductionJobQualityPage jobId={jobId} />;
}

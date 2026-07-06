import { requirePermission } from "@/lib/server-auth";
import ProductionJobWastePage from "@/modules/production/pages/job-waste";

type ProductionJobWasteRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ProductionJobWasteRoutePage({
  params,
}: ProductionJobWasteRouteProps) {
  await requirePermission("production.read");

  const { jobId } = await params;

  return <ProductionJobWastePage jobId={jobId} />;
}

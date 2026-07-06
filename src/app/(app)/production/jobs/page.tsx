import { requirePermission } from "@/lib/server-auth";
import ProductionJobsListPage from "@/modules/production/pages/jobs-list";

export default async function ProductionJobsRoutePage() {
  await requirePermission("production.read");

  return <ProductionJobsListPage />;
}

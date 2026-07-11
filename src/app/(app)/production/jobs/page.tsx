import { requirePermission } from "@/lib/server-auth";
import { ProductionOrdersPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionJobsRoutePage() {
  await requirePermission("production.read");

  return <ProductionOrdersPage />;
}

import { requirePermission } from "@/lib/server-auth";
import CuttingOptimizationsListPage from "@/modules/cutting/pages/optimizations-list";

export default async function CuttingOptimizationsPage() {
  await requirePermission("cutting.read");

  return <CuttingOptimizationsListPage />;
}

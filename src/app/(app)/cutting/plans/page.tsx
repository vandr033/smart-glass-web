import { requirePermission } from "@/lib/server-auth";
import CuttingPlansListPage from "@/modules/cutting/pages/plans-list";

export default async function CuttingPlansPage() {
  await requirePermission("cutting.read");

  return <CuttingPlansListPage />;
}

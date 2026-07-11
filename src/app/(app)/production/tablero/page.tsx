import { requirePermission } from "@/lib/server-auth";
import ProductionBoardPage from "@/modules/production/pages/board";

export default async function ProductionBoardRoutePage() {
  await requirePermission("production.read");
  return <ProductionBoardPage />;
}

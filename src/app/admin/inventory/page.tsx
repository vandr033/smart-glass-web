import { requirePermission } from "@/lib/server-auth";
import InventoryDashboardPage from "@/modules/inventory/pages/dashboard";

export default async function AdminInventoryPage() {
  await requirePermission("inventory.read");

  return <InventoryDashboardPage />;
}

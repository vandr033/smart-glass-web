import { requirePermission } from "@/lib/server-auth";
import InventoryRemnantsPage from "@/modules/inventory/pages/remnants";

export default async function AdminInventoryRemnantsPage() {
  await requirePermission("inventory.read");

  return <InventoryRemnantsPage />;
}

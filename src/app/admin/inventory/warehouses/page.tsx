import { requirePermission } from "@/lib/server-auth";
import InventoryWarehousesPage from "@/modules/inventory/pages/warehouses";

export default async function AdminInventoryWarehousesPage() {
  await requirePermission("inventory.read");

  return <InventoryWarehousesPage />;
}

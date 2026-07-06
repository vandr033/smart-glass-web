import { requirePermission } from "@/lib/server-auth";
import InventoryDamagedPage from "@/modules/inventory/pages/damaged";

export default async function AdminInventoryDamagedPage() {
  await requirePermission("inventory.read");

  return <InventoryDamagedPage />;
}

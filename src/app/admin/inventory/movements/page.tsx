import { requirePermission } from "@/lib/server-auth";
import InventoryMovementsPage from "@/modules/inventory/pages/movements";

export default async function AdminInventoryMovementsPage() {
  await requirePermission("inventory.read");

  return <InventoryMovementsPage />;
}

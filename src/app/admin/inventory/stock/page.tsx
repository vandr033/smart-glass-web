import { requirePermission } from "@/lib/server-auth";
import InventoryStockPage from "@/modules/inventory/pages/stock";

export default async function AdminInventoryStockPage() {
  const authorization = await requirePermission("inventory.read");

  return (
    <InventoryStockPage
      canCreate={authorization.permissions.includes("inventory.create")}
    />
  );
}

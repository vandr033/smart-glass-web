import { requirePermission } from "@/lib/server-auth";
import NewStockEntryPage from "@/modules/inventory/pages/new-stock";

export default async function AdminInventoryNewStockPage() {
  await requirePermission("inventory.create");

  return <NewStockEntryPage />;
}

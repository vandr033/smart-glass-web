import { requirePermission } from "@/lib/server-auth";
import NewPurchaseOrderPage from "@/modules/purchasing/pages/new-order";

export default async function PurchasingNewOrderRoutePage() {
  await requirePermission("purchasing.create_po");

  return <NewPurchaseOrderPage />;
}

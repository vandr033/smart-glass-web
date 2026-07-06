import { requirePermission } from "@/lib/server-auth";
import PurchasingOrdersListPage from "@/modules/purchasing/pages/orders-list";

export default async function PurchasingOrdersRoutePage() {
  await requirePermission("purchasing.read");

  return <PurchasingOrdersListPage />;
}

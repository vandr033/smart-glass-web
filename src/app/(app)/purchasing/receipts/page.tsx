import { requirePermission } from "@/lib/server-auth";
import PurchasingReceiptsListPage from "@/modules/purchasing/pages/receipts-list";

export default async function PurchasingReceiptsRoutePage() {
  await requirePermission("purchasing.read");

  return <PurchasingReceiptsListPage />;
}

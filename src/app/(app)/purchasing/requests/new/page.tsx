import { requirePermission } from "@/lib/server-auth";
import NewPurchaseRequestPage from "@/modules/purchasing/pages/new-request";

export default async function PurchasingNewRequestRoutePage() {
  await requirePermission("purchasing.create");

  return <NewPurchaseRequestPage />;
}

import { requirePermission } from "@/lib/server-auth";
import PurchasingRequestsListPage from "@/modules/purchasing/pages/requests-list";

export default async function PurchasingRequestsRoutePage() {
  await requirePermission("purchasing.read");

  return <PurchasingRequestsListPage />;
}

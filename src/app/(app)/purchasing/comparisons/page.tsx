import { requirePermission } from "@/lib/server-auth";
import PurchasingComparisonsListPage from "@/modules/purchasing/pages/comparisons-list";

export default async function PurchasingComparisonsRoutePage() {
  await requirePermission("purchasing.read");

  return <PurchasingComparisonsListPage />;
}

import { requirePermission } from "@/lib/server-auth";
import PriceListHistoryPage from "@/modules/price-lists/pages/history";

export default async function AdminPriceListHistoryPage() {
  await requirePermission("price_lists.read");

  return <PriceListHistoryPage />;
}

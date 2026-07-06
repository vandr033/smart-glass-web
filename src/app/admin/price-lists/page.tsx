import PriceListsListPage from "@/modules/price-lists/pages/list";
import { requirePermission } from "@/lib/server-auth";

export default async function AdminPriceListsPage() {
  const authorization = await requirePermission("price_lists.read");

  return (
    <PriceListsListPage
      canImport={authorization.permissions.includes("price_lists.import")}
    />
  );
}

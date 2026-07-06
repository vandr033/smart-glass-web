import { requirePermission } from "@/lib/server-auth";
import ImportPriceListPage from "@/modules/price-lists/pages/import";

export default async function AdminPriceListImportPage() {
  await requirePermission("price_lists.import");

  return <ImportPriceListPage />;
}

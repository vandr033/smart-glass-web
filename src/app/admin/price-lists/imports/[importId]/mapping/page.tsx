import { requirePermission } from "@/lib/server-auth";
import PriceListMappingPage from "@/modules/price-lists/pages/mapping";

export default async function AdminPriceListMappingPage({
  params,
}: {
  params: Promise<{
    importId: string;
  }>;
}) {
  await requirePermission("price_lists.read");
  const { importId } = await params;

  return <PriceListMappingPage importId={importId} />;
}

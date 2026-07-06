import { requirePermission } from "@/lib/server-auth";
import PriceListDetailPage from "@/modules/price-lists/pages/detail";

export default async function AdminPriceListDetailPage({
  params,
}: {
  params: Promise<{
    importId: string;
  }>;
}) {
  await requirePermission("price_lists.read");
  const { importId } = await params;

  return <PriceListDetailPage importId={importId} />;
}

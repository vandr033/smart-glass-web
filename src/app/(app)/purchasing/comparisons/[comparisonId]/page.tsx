import { requirePermission } from "@/lib/server-auth";
import PurchasingComparisonDetailPage from "@/modules/purchasing/pages/comparison-detail";

type PurchasingComparisonDetailRouteProps = {
  params: Promise<{
    comparisonId: string;
  }>;
};

export default async function PurchasingComparisonDetailRoutePage({
  params,
}: PurchasingComparisonDetailRouteProps) {
  await requirePermission("purchasing.read");

  const { comparisonId } = await params;

  return <PurchasingComparisonDetailPage comparisonId={comparisonId} />;
}

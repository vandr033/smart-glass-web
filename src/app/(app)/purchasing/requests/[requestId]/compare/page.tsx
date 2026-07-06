import { requirePermission } from "@/lib/server-auth";
import PurchasingRequestComparePage from "@/modules/purchasing/pages/request-compare";

type PurchasingRequestCompareRouteProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function PurchasingRequestCompareRoutePage({
  params,
}: PurchasingRequestCompareRouteProps) {
  await requirePermission("purchasing.compare_suppliers");

  const { requestId } = await params;

  return <PurchasingRequestComparePage requestId={requestId} />;
}

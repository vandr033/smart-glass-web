import { requirePermission } from "@/lib/server-auth";
import PurchasingRequestDetailPage from "@/modules/purchasing/pages/request-detail";

type PurchasingRequestDetailRouteProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function PurchasingRequestDetailRoutePage({
  params,
}: PurchasingRequestDetailRouteProps) {
  await requirePermission("purchasing.read");

  const { requestId } = await params;

  return <PurchasingRequestDetailPage requestId={requestId} />;
}

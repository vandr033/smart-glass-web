import { requirePermission } from "@/lib/server-auth";
import PurchasingOrderDetailPage from "@/modules/purchasing/pages/order-detail";

type PurchasingOrderDetailRouteProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function PurchasingOrderDetailRoutePage({
  params,
}: PurchasingOrderDetailRouteProps) {
  await requirePermission("purchasing.read");

  const { orderId } = await params;

  return <PurchasingOrderDetailPage orderId={orderId} />;
}

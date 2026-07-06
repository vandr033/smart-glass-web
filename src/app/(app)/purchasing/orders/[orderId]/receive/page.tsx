import { requirePermission } from "@/lib/server-auth";
import PurchasingReceiveOrderPage from "@/modules/purchasing/pages/receive-order";

type PurchasingReceiveOrderRouteProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function PurchasingReceiveOrderRoutePage({
  params,
}: PurchasingReceiveOrderRouteProps) {
  await requirePermission("purchasing.receive");

  const { orderId } = await params;

  return <PurchasingReceiveOrderPage orderId={orderId} />;
}

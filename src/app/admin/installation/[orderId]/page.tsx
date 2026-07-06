import { requirePermission } from "@/lib/server-auth";
import InstallationDetailPage from "@/modules/installation/pages/detail";

type InstallationDetailRoutePageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function InstallationDetailRoutePage({
  params,
}: InstallationDetailRoutePageProps) {
  await requirePermission("installations.view");

  const { orderId } = await params;

  return <InstallationDetailPage orderId={orderId} />;
}

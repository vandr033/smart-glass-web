import { requirePermission } from "@/lib/server-auth";
import SupplierViewPage from "@/modules/suppliers/pages/view";

type SupplierRoutePageProps = {
  params: Promise<{
    supplierId: string;
  }>;
};

export default async function SupplierRoutePage({ params }: SupplierRoutePageProps) {
  await requirePermission("suppliers.read");

  const { supplierId } = await params;

  return <SupplierViewPage supplierId={supplierId} />;
}

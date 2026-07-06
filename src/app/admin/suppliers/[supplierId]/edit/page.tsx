import { requirePermission } from "@/lib/server-auth";
import EditSupplierPage from "@/modules/suppliers/pages/edit";

type EditSupplierRoutePageProps = {
  params: Promise<{
    supplierId: string;
  }>;
};

export default async function EditSupplierRoutePage({
  params,
}: EditSupplierRoutePageProps) {
  await requirePermission("suppliers.update");

  const { supplierId } = await params;

  return <EditSupplierPage supplierId={supplierId} />;
}

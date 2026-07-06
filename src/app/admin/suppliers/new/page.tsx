import { requirePermission } from "@/lib/server-auth";
import CreateSupplierPage from "@/modules/suppliers/pages/create";

export default async function NewSupplierRoutePage() {
  await requirePermission("suppliers.create");

  return <CreateSupplierPage />;
}

import { requireAllPermissions } from "@/lib/server-auth";
import SupplierMaterialEquivalencesPage from "@/modules/materials/pages/equivalences";

export default async function AdminSupplierMaterialEquivalencesPage() {
  await requireAllPermissions(["materials.read", "suppliers.read"]);

  return <SupplierMaterialEquivalencesPage />;
}

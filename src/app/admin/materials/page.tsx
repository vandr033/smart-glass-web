import { requirePermission } from "@/lib/server-auth";
import MaterialsListPage from "@/modules/materials/pages/list";

export default async function AdminMaterialsPage() {
  const authorization = await requirePermission("materials.read");

  return (
    <MaterialsListPage
      canCreate={authorization.permissions.includes("materials.create")}
    />
  );
}

import { requirePermission } from "@/lib/server-auth";
import MaterialCategoriesPage from "@/modules/materials/pages/categories";

export default async function AdminMaterialCategoriesPage() {
  await requirePermission("materials.read");

  return <MaterialCategoriesPage />;
}

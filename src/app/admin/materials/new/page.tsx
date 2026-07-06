import { requirePermission } from "@/lib/server-auth";
import CreateMaterialPage from "@/modules/materials/pages/create";

export default async function NewMaterialRoutePage() {
  await requirePermission("materials.create");

  return <CreateMaterialPage />;
}

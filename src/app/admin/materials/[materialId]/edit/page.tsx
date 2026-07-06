import { requirePermission } from "@/lib/server-auth";
import EditMaterialPage from "@/modules/materials/pages/edit";

type EditMaterialRoutePageProps = {
  params: Promise<{
    materialId: string;
  }>;
};

export default async function EditMaterialRoutePage({
  params,
}: EditMaterialRoutePageProps) {
  await requirePermission("materials.update");

  const { materialId } = await params;

  return <EditMaterialPage materialId={materialId} />;
}

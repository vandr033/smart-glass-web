import { requirePermission } from "@/lib/server-auth";
import MaterialViewPage from "@/modules/materials/pages/view";

type MaterialRoutePageProps = {
  params: Promise<{
    materialId: string;
  }>;
};

export default async function MaterialRoutePage({ params }: MaterialRoutePageProps) {
  await requirePermission("materials.read");

  const { materialId } = await params;

  return <MaterialViewPage materialId={materialId} />;
}

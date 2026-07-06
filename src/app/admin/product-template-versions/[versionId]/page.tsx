import { requireAnyPermission } from "@/lib/server-auth";
import ProductTemplateVersionViewPage from "@/modules/product-templates/pages/version-view";

export default async function AdminProductTemplateVersionPage({
  params,
}: {
  params: Promise<{
    versionId: string;
  }>;
}) {
  const authorization = await requireAnyPermission([
    "quotations.create",
    "quotations.update",
  ]);
  const { versionId } = await params;

  return (
    <ProductTemplateVersionViewPage
      canManage={authorization.permissions.includes("system.settings.update")}
      versionId={versionId}
    />
  );
}

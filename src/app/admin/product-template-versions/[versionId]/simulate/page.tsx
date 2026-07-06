import { requireAnyPermission } from "@/lib/server-auth";
import ProductTemplateVersionSimulatePage from "@/modules/product-templates/pages/version-simulate";

export default async function AdminProductTemplateVersionSimulatePage({
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
    <ProductTemplateVersionSimulatePage
      canViewHistory={authorization.permissions.includes("system.settings.read")}
      versionId={versionId}
    />
  );
}

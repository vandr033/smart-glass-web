import { requireAnyPermission } from "@/lib/server-auth";
import ProductTemplateViewPage from "@/modules/product-templates/pages/view";

export default async function AdminProductTemplateViewPage({
  params,
}: {
  params: Promise<{
    templateId: string;
  }>;
}) {
  const authorization = await requireAnyPermission([
    "quotations.create",
    "quotations.update",
  ]);
  const { templateId } = await params;

  return (
    <ProductTemplateViewPage
      canManage={authorization.permissions.includes("system.settings.update")}
      templateId={templateId}
    />
  );
}

import { requirePermission } from "@/lib/server-auth";
import EditProductTemplatePage from "@/modules/product-templates/pages/edit";

export default async function AdminEditProductTemplatePage({
  params,
}: {
  params: Promise<{
    templateId: string;
  }>;
}) {
  await requirePermission("system.settings.update");
  const { templateId } = await params;

  return <EditProductTemplatePage templateId={templateId} />;
}

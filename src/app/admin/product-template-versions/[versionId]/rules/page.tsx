import { requirePermission } from "@/lib/server-auth";
import ProductTemplateVersionRulesPage from "@/modules/product-templates/pages/version-rules";

export default async function AdminProductTemplateVersionRulesPage({
  params,
}: {
  params: Promise<{
    versionId: string;
  }>;
}) {
  await requirePermission("system.settings.update");
  const { versionId } = await params;

  return <ProductTemplateVersionRulesPage versionId={versionId} />;
}

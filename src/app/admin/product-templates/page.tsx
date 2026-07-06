import { requireAnyPermission } from "@/lib/server-auth";
import ProductTemplatesListPage from "@/modules/product-templates/pages/list";

export default async function AdminProductTemplatesPage() {
  const authorization = await requireAnyPermission([
    "quotations.create",
    "quotations.update",
  ]);

  return (
    <ProductTemplatesListPage
      canManage={authorization.permissions.includes("system.settings.update")}
    />
  );
}

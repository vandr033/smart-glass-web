import { requirePermission } from "@/lib/server-auth";
import CreateProductTemplatePage from "@/modules/product-templates/pages/create";

export default async function AdminCreateProductTemplatePage() {
  await requirePermission("system.settings.update");

  return <CreateProductTemplatePage />;
}

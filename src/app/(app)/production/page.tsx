import { requirePermission } from "@/lib/server-auth";
import ProductionHomePage from "@/modules/production/pages/home";

export default async function ProductionPage() {
  await requirePermission("production.read");

  return <ProductionHomePage />;
}

import { requirePermission } from "@/lib/server-auth";
import { ProductionQualityPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionQualityRoutePage() { await requirePermission("production.read"); return <ProductionQualityPage />; }

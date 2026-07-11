import { requirePermission } from "@/lib/server-auth";
import { ProductionCentersPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionCentersRoutePage() { await requirePermission("production.read"); return <ProductionCentersPage />; }

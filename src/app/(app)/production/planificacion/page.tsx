import { requirePermission } from "@/lib/server-auth";
import { ProductionPlanningPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionPlanningRoutePage() { await requirePermission("production.read"); return <ProductionPlanningPage />; }

import { requirePermission } from "@/lib/server-auth";
import { ProductionReportsPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionReportsRoutePage() { await requirePermission("production.read"); return <ProductionReportsPage />; }

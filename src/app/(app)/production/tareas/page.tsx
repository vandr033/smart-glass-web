import { requirePermission } from "@/lib/server-auth";
import { ProductionTasksPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionTasksRoutePage() { await requirePermission("production.read"); return <ProductionTasksPage />; }

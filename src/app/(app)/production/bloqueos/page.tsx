import { requirePermission } from "@/lib/server-auth";
import { ProductionBlocksPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionBlocksRoutePage() { await requirePermission("production.read"); return <ProductionBlocksPage />; }

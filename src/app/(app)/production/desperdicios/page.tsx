import { requirePermission } from "@/lib/server-auth";
import { ProductionWastePage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionWasteRoutePage() { await requirePermission("production.read"); return <ProductionWastePage />; }

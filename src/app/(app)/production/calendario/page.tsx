import { requirePermission } from "@/lib/server-auth";
import { ProductionCalendarPage } from "@/modules/production/pages/advanced-pages";

export default async function ProductionCalendarRoutePage() { await requirePermission("production.read"); return <ProductionCalendarPage />; }

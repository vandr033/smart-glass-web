import { requirePermission } from "@/lib/server-auth";
import ProductionJobDetailPage from "@/modules/production/pages/job-detail";

export default async function ProductionOrderDetailRoutePage({ params }: { params: Promise<{ jobId: string }> }) { await requirePermission("production.read"); const { jobId } = await params; return <ProductionJobDetailPage jobId={jobId} />; }

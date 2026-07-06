import { requirePermission } from "@/lib/server-auth";
import NewProductionJobPage from "@/modules/production/pages/job-new";

export default async function NewProductionJobRoutePage() {
  await requirePermission("production.create");

  return <NewProductionJobPage />;
}

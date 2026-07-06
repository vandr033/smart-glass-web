import { requirePermission } from "@/lib/server-auth";
import ProfileOptimizationsListPage from "@/modules/profile-optimization/pages/optimizations-list";

export default async function ProfileOptimizationsRoutePage() {
  await requirePermission("cutting.read");

  return <ProfileOptimizationsListPage />;
}

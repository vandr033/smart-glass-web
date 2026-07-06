import { requirePermission } from "@/lib/server-auth";
import ProfileCuttingPlansListPage from "@/modules/profile-optimization/pages/plans-list";

export default async function ProfileCuttingPlansRoutePage() {
  await requirePermission("cutting.read");

  return <ProfileCuttingPlansListPage />;
}

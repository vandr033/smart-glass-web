import { requirePermission } from "@/lib/server-auth";
import CreatePostventaPage from "@/modules/postventa/pages/create";

export default async function CreatePostventaRoutePage() {
  await requirePermission("postventa.crear");

  return <CreatePostventaPage />;
}

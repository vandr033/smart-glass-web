import { requirePermission } from "@/lib/server-auth";
import PostventaHomePage from "@/modules/postventa/pages/home";

export default async function PostventaPage() {
  await requirePermission("postventa.ver");

  return <PostventaHomePage />;
}

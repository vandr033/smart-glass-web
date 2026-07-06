import { requirePermission } from "@/lib/server-auth";
import CuttingHomePage from "@/modules/cutting/pages/home";

export default async function CuttingPage() {
  await requirePermission("cutting.read");

  return <CuttingHomePage />;
}

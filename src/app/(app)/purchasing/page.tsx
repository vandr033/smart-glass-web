import { requirePermission } from "@/lib/server-auth";
import PurchasingHomePage from "@/modules/purchasing/pages/home";

export default async function PurchasingPage() {
  await requirePermission("purchasing.read");

  return <PurchasingHomePage />;
}

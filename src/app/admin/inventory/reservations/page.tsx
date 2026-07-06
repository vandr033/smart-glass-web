import { requirePermission } from "@/lib/server-auth";
import InventoryReservationsPage from "@/modules/inventory/pages/reservations";

export default async function AdminInventoryReservationsPage() {
  await requirePermission("inventory.read");

  return <InventoryReservationsPage />;
}

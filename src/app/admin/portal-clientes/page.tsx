import { requirePermission } from "@/lib/server-auth";
import ClientPortalAdminPage from "@/modules/client-portal/admin-page";

export default async function AdminPortalClientesPage() {
  await requirePermission("portal_cliente.ver");

  return <ClientPortalAdminPage />;
}

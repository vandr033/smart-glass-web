import { requirePermission } from "@/lib/server-auth";
import ClientsListPage from "@/modules/clients/pages/list";

export default async function AdminClientsPage() {
  const authorization = await requirePermission("clients.read");

  return (
    <ClientsListPage
      canCreate={authorization.permissions.includes("clients.create")}
    />
  );
}

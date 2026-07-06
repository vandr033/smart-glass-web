import { requirePermission } from "@/lib/server-auth";
import SuppliersListPage from "@/modules/suppliers/pages/list";

export default async function AdminSuppliersPage() {
  const authorization = await requirePermission("suppliers.read");

  return (
    <SuppliersListPage
      canCreate={authorization.permissions.includes("suppliers.create")}
      canReadSettings={authorization.permissions.includes("system.settings.read")}
    />
  );
}

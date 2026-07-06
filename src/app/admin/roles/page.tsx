import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RolesManager } from "@/modules/admin/roles-manager";

export default async function AdminRolesPage() {
  await requirePermission("system.roles.read");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Administra el acceso por roles con una matriz de permisos clara, auditable y consistente con el resto del ERP."
        eyebrow="Control de acceso"
        title="Roles y permisos"
      />

      <RolesManager />
    </main>
  );
}

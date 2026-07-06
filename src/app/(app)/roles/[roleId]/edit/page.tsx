import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleForm } from "@/modules/roles/role-form";

type EditRolePageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function EditRolePage({ params }: EditRolePageProps) {
  await requirePermission("system.roles.update");

  const { roleId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualiza el perfil del rol y su matriz de permisos manteniendo las reglas de seguridad administrativas."
        eyebrow="Editar rol"
        title="Editar rol"
      />

      <RoleForm mode="edit" roleId={roleId} />
    </main>
  );
}

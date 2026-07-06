import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleForm } from "@/modules/roles/role-form";

export default async function NewRolePage() {
  await requirePermission("roles.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea un conjunto reutilizable de accesos con nombre validado, descripcion opcional y una matriz de permisos explicita."
        eyebrow="Crear rol"
        title="Nuevo rol"
      />

      <RoleForm mode="create" />
    </main>
  );
}

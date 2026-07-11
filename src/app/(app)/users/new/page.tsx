import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserForm } from "@/modules/users/user-form";

export default async function NewUserPage() {
  await requirePermission("system.users.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree un usuario con credenciales validadas, roles asignados y estado activo desde el flujo administrativo."
        eyebrow="Crear usuario"
        title="Nuevo usuario"
      />

      <UserForm mode="create" />
    </main>
  );
}

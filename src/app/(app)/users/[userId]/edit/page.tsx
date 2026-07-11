import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserForm } from "@/modules/users/user-form";

type EditUserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requirePermission("system.users.update");

  const { userId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice los datos de la cuenta, los roles asignados y el estado activo con las mismas validaciones del alta."
        eyebrow="Editar usuario"
        title="Editar usuario"
      />

      <UserForm mode="edit" userId={userId} />
    </main>
  );
}

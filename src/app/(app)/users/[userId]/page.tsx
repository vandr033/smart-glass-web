import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserDetail } from "@/modules/users/user-detail";

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requirePermission("system.users.read");

  const { userId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa los metadatos de la cuenta, los roles asignados, el estado y las acciones del ciclo de vida desde el módulo compartido de usuarios."
        eyebrow="Registro del usuario"
        title="Detalle del usuario"
      />

      <UserDetail userId={userId} />
    </main>
  );
}

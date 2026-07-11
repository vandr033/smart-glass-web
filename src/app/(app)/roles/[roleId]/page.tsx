import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { RoleDetail } from "@/modules/roles/role-detail";

type RoleDetailPageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  await requirePermission("system.roles.read");

  const { roleId } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Revisa los permisos asignados, los metadatos y las protecciones de roles desde el módulo compartido de administración de roles."
        eyebrow="Registro del rol"
        title="Detalle del rol"
      />

      <RoleDetail roleId={roleId} />
    </main>
  );
}

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
        description="Review assigned permissions, metadata, and protected-role safeguards from the shared role management module."
        eyebrow="Role Record"
        title="Role Details"
      />

      <RoleDetail roleId={roleId} />
    </main>
  );
}

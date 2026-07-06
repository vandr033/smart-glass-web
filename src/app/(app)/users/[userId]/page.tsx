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
        description="Review account metadata, role assignments, status, and lifecycle actions from the shared user management module."
        eyebrow="User Record"
        title="User Details"
      />

      <UserDetail userId={userId} />
    </main>
  );
}

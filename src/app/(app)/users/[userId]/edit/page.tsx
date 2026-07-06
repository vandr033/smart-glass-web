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
        description="Update account details, assigned roles, and active status using the same validation contract as the create flow."
        eyebrow="Edit User"
        title="Edit User"
      />

      <UserForm mode="edit" userId={userId} />
    </main>
  );
}

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserForm } from "@/modules/users/user-form";

export default async function NewUserPage() {
  await requirePermission("system.users.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Create a new user with validated credentials, role assignments, and active status from the shared module workflow."
        eyebrow="Create User"
        title="New User"
      />

      <UserForm mode="create" />
    </main>
  );
}

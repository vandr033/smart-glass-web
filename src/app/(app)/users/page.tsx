import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { UserTable } from "@/modules/users/user-table";

export default async function UsersPage() {
  const authorization = await requirePermission("system.users.read");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("system.users.create") ? (
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href="/users/new"
            >
              Nuevo usuario
            </Link>
          ) : null
        }
        description="El modulo de usuarios ya opera sobre la base compartida de tablas, con filtros, exportacion y comportamiento consistente para futuras pantallas."
        eyebrow="Sistema"
        title="Usuarios"
      />

      <UserTable />
    </main>
  );
}

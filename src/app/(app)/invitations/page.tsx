import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { InvitationTable } from "@/modules/invitations/invitation-table";

export default async function InvitationsPage() {
  const authorization = await requirePermission("invitations.view");

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          authorization.permissions.includes("invitations.create") ? (
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href="/invitations/new"
            >
              Crear invitación
            </Link>
          ) : null
        }
        description="Consulta las invitaciones pendientes, aceptadas, vencidas y revocadas desde el mismo sistema de tablas del área administrativa."
        eyebrow="Incorporación"
        title="Invitaciones"
      />

      <InvitationTable />
    </main>
  );
}

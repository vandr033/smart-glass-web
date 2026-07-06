import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { AuditLogManager } from "@/modules/admin/audit-log-manager";

export default async function AdminAuditLogPage() {
  await requirePermission("system.audit.read");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Consulta los eventos relevantes del sistema, cambios administrativos y actividad registrada."
        eyebrow="Auditoría"
        title="Registro de auditoría"
      />

      <AuditLogManager />
    </main>
  );
}

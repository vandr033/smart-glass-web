import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { NotificationCenter } from "@/modules/notifications/notification-center";

export default async function NotificationsPage() {
  const authorization = await requirePermission("notifications.view");
  const canCreate = authorization.permissions.includes("notifications.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="El centro de notificaciones administra la campana compartida, los contadores de mensajes no leídos y los flujos reutilizables de la bandeja."
        eyebrow="Bandeja"
        title="Notificaciones"
      />

      <NotificationCenter canCreate={canCreate} />
    </main>
  );
}

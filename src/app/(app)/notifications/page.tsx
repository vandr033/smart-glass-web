import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { NotificationCenter } from "@/modules/notifications/notification-center";

export default async function NotificationsPage() {
  const authorization = await requirePermission("notifications.view");
  const canCreate = authorization.permissions.includes("notifications.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="The notification center now powers the shared bell, unread counters, and reusable inbox workflows that future delivery channels can extend."
        eyebrow="Inbox"
        title="Notifications"
      />

      <NotificationCenter canCreate={canCreate} />
    </main>
  );
}

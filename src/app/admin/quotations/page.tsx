import { requirePermission } from "@/lib/server-auth";
import QuotationsListPage from "@/modules/quotations/pages/list";

export default async function AdminQuotationsPage() {
  const authorization = await requirePermission("quotations.read");

  return (
    <QuotationsListPage
      canApprove={authorization.permissions.includes("quotations.approve")}
      canCreate={authorization.permissions.includes("quotations.create")}
    />
  );
}

import { requirePermission } from "@/lib/server-auth";
import QuotationApprovalsPage from "@/modules/quotations/pages/approvals";

export default async function AdminQuotationApprovalsPage() {
  await requirePermission("quotations.approve");

  return <QuotationApprovalsPage />;
}

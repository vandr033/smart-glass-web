import { requirePermission } from "@/lib/server-auth";
import CreateQuotationPage from "@/modules/quotations/pages/create";

export default async function AdminNewQuotationPage() {
  await requirePermission("quotations.create");

  return <CreateQuotationPage />;
}

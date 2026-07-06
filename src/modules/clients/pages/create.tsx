import { PageHeader } from "@/components/ui/page-header";

import { ClientForm } from "../components/ClientForm";

export default function CreateClientPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Create a client record with the billing, identification, and contact context needed before projects move into measurement and quotation."
        eyebrow="Create Client"
        title="New Client"
      />

      <ClientForm mode="create" />
    </main>
  );
}

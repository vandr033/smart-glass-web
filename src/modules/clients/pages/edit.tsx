import { PageHeader } from "@/components/ui/page-header";

import { ClientForm } from "../components/ClientForm";

type EditClientPageProps = {
  clientId: string;
};

export default function EditClientPage({ clientId }: EditClientPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Update the client identity and contact context using the same audited workflow as creation."
        eyebrow="Edit Client"
        title="Edit Client"
      />

      <ClientForm clientId={clientId} mode="edit" />
    </main>
  );
}

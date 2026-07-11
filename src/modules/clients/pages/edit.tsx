import { PageHeader } from "@/components/ui/page-header";

import { ClientForm } from "../components/ClientForm";

type EditClientPageProps = {
  clientId: string;
};

export default function EditClientPage({ clientId }: EditClientPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Actualice la identidad y los contactos del cliente con el mismo flujo auditado de creación."
        eyebrow="Editar cliente"
        title="Editar cliente"
      />

      <ClientForm clientId={clientId} mode="edit" />
    </main>
  );
}

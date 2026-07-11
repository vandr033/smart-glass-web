import { PageHeader } from "@/components/ui/page-header";

import { ClientForm } from "../components/ClientForm";

export default function CreateClientPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        description="Cree el registro del cliente con sus datos de facturación, identificación y contacto antes de iniciar mediciones y cotizaciones."
        eyebrow="Crear cliente"
        title="Nuevo cliente"
      />

      <ClientForm mode="create" />
    </main>
  );
}

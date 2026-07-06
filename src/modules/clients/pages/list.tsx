import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { primaryButtonClassName } from "@/modules/commercial/ui";

import { CLIENTS_ROUTES } from "../constants";
import { ClientTable } from "../components/ClientTable";

type ClientsListPageProps = {
  canCreate: boolean;
};

export default function ClientsListPage({ canCreate }: ClientsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          canCreate ? (
            <Link className={primaryButtonClassName} href={CLIENTS_ROUTES.create}>
              Nuevo cliente
            </Link>
          ) : null
        }
        description="Gestiona la base comercial de clientes que dara contexto a proyectos, cotizaciones y ejecucion posterior."
        eyebrow="Comercial"
        title="Clientes"
      />

      <ClientTable />
    </main>
  );
}

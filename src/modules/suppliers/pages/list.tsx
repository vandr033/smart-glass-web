import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/modules/commercial/ui";

import { SupplierTable } from "../components/SupplierTable";
import { SUPPLIERS_ROUTES } from "../constants";

type SuppliersListPageProps = {
  canCreate: boolean;
  canReadSettings: boolean;
};

export default function SuppliersListPage({
  canCreate,
  canReadSettings,
}: SuppliersListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            {canReadSettings ? (
              <Link
                className={secondaryButtonClassName}
                href={SUPPLIERS_ROUTES.categories}
              >
                Gestionar categorias
              </Link>
            ) : null}
            {canReadSettings ? (
              <Link
                className={secondaryButtonClassName}
                href={SUPPLIERS_ROUTES.scoring}
              >
                Configuracion de puntajes
              </Link>
            ) : null}
            {canCreate ? (
              <Link
                className={primaryButtonClassName}
                href={SUPPLIERS_ROUTES.create}
              >
                Nuevo proveedor
              </Link>
            ) : null}
          </>
        }
        description="Gestiona perfiles, contactos, condiciones comerciales y puntajes para compras."
        eyebrow="Compras"
        title="Proveedores"
      />

      <SupplierTable />
    </main>
  );
}

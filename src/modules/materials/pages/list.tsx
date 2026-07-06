import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/modules/commercial/ui";

import { MaterialTable } from "../components/MaterialTable";
import { MATERIALS_ROUTES } from "../constants";

type MaterialsListPageProps = {
  canCreate: boolean;
};

export default function MaterialsListPage({ canCreate }: MaterialsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className={secondaryButtonClassName}
              href={MATERIALS_ROUTES.categories}
            >
              Categorias de materiales
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={MATERIALS_ROUTES.equivalences}
            >
              Equivalencias de proveedor
            </Link>
            {canCreate ? (
              <Link
                className={primaryButtonClassName}
                href={MATERIALS_ROUTES.create}
              >
                Nuevo material
              </Link>
            ) : null}
          </>
        }
        description="Gestiona el catalogo maestro de materiales que reutilizaran precios, cotizaciones, corte, inventario y produccion."
        eyebrow="Catalogo"
        title="Materiales"
      />

      <MaterialTable />
    </main>
  );
}

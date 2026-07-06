import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/modules/commercial/ui";

import { QUOTATIONS_ROUTES } from "../constants";
import { QuotationTable } from "../components/QuotationTable";

type QuotationsListPageProps = {
  canApprove: boolean;
  canCreate: boolean;
};

export default function QuotationsListPage({
  canApprove,
  canCreate,
}: QuotationsListPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            {canApprove ? (
              <Link
                className={secondaryButtonClassName}
                href={QUOTATIONS_ROUTES.approvals}
              >
                Cola de aprobaciones
              </Link>
            ) : null}
            {canCreate ? (
              <Link className={primaryButtonClassName} href={QUOTATIONS_ROUTES.create}>
                Nueva cotizacion
              </Link>
            ) : null}
          </>
        }
        description="Abre, sigue y gestiona cotizaciones con contexto comercial, estados de aprobacion y vistas previas listas."
        eyebrow="Comercial"
        title="Cotizaciones"
      />

      <QuotationTable />
    </main>
  );
}

import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { secondaryButtonClassName } from "@/modules/commercial/ui";

import { InventoryStockTable } from "../components/InventoryStockTable";
import { INVENTORY_ROUTES } from "../constants";

type InventoryStockPageProps = {
  canCreate: boolean;
};

export default function InventoryStockPage({ canCreate }: InventoryStockPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.reservations}>
              Reservas
            </Link>
            <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.warehouses}>
              Almacenes
            </Link>
            {canCreate ? (
              <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.newStock}>
                Nuevo ingreso
              </Link>
            ) : null}
          </>
        }
        description="Revisa saldos actuales, dimensiones, ubicacion en almacen y accesos rapidos para ajustar, reservar, reportar dano o trasladar stock."
        eyebrow="Operaciones"
        title="Stock de inventario"
      />

      <InventoryStockTable />
    </main>
  );
}

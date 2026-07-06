"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Layers3,
  PackageSearch,
  Warehouse,
} from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  formatDateValue,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";

import { INVENTORY_MOVEMENT_TYPE_LABELS, INVENTORY_QUERY_KEYS, INVENTORY_ROUTES } from "../constants";

export function InventoryDashboard() {
  const dashboardQuery = useQuery({
    queryFn: inventoryService.getDashboard,
    queryKey: INVENTORY_QUERY_KEYS.dashboard,
  });

  if (dashboardQuery.isLoading) {
    return <LoadingState cards={6} title="Cargando panel de inventario" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void dashboardQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          dashboardQuery.error?.message ??
          "No se pudo cargar la visibilidad general del inventario."
        }
        title="No se pudo cargar el panel de inventario"
      />
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.stock}>
              Stock
            </Link>
            <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.reservations}>
              Reservas
            </Link>
            <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.warehouses}>
              Almacenes
            </Link>
          </>
        }
        description="Monitorea el stock disponible, las reservas, los remanentes, el material dañado y los movimientos recientes del módulo de inventario."
        eyebrow="Operaciones"
        title="Inventario"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          description="Registros de materiales distintos que actualmente cuentan con stock activo."
          href={INVENTORY_ROUTES.stock}
          icon={Boxes}
          label="Materiales con stock"
          tone="accent"
          value={dashboard.totalMaterialsWithStock.toLocaleString("es-BO")}
        />
        <StatCard
          description="Registros de stock que hoy se encuentran en o por debajo del nivel operativo considerado como bajo."
          href={INVENTORY_ROUTES.stock}
          icon={PackageSearch}
          label="Stock bajo"
          value={dashboard.lowStockCount.toLocaleString("es-BO")}
        />
        <StatCard
          description="Reservas que siguen activas entre asignaciones blandas y firmes."
          href={INVENTORY_ROUTES.reservations}
          icon={ClipboardList}
          label="Stock reservado"
          value={dashboard.reservedStockCount.toLocaleString("es-BO")}
        />
        <StatCard
          description="Registros de material dañado que siguen abiertos para revisión, desecho o devolución."
          href={INVENTORY_ROUTES.damaged}
          icon={AlertTriangle}
          label="Material dañado"
          value={dashboard.damagedStockCount.toLocaleString("es-BO")}
        />
        <StatCard
          description="Piezas remanentes reutilizables registradas para futuros usos de corte."
          href={INVENTORY_ROUTES.remnants}
          icon={Layers3}
          label="Remanentes"
          value={dashboard.remnantsCount.toLocaleString("es-BO")}
        />
        <StatCard
          description="Almacenes y ubicaciones disponibles para visibilidad de stock y traslados."
          href={INVENTORY_ROUTES.warehouses}
          icon={Warehouse}
          label="Almacenes"
          value="Gestionar"
        />
      </section>

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Movimientos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Movimientos recientes
            </h2>
          </div>

          <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.movements}>
            Ver historial completo
          </Link>
        </div>

        {dashboard.recentMovements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-5 py-8 text-sm text-stone-600">
            El historial aparecerá aquí después del primer ingreso, ajuste, reserva o traslado de stock.
          </div>
        ) : (
          <div className={tableWrapperClassName}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.2em] text-stone-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Fecha</th>
                    <th className="px-5 py-4 font-semibold">Movimiento</th>
                    <th className="px-5 py-4 font-semibold">Material</th>
                    <th className="px-5 py-4 font-semibold">Almacén</th>
                    <th className="px-5 py-4 font-semibold">Cantidad</th>
                    <th className="px-5 py-4 font-semibold">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentMovements.map((movement) => (
                    <tr key={movement.id} className="border-t border-stone-200/80">
                      <td className="px-5 py-4 text-stone-700">
                        {formatDateValue(movement.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-900">
                        {INVENTORY_MOVEMENT_TYPE_LABELS[movement.movementType]}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-stone-900">{movement.material.name}</p>
                        <p className="text-xs text-stone-500">{movement.material.code}</p>
                      </td>
                      <td className="px-5 py-4 text-stone-700">{movement.warehouse.name}</td>
                      <td className="px-5 py-4 text-stone-700">
                        {movement.quantity.toLocaleString("es-BO")} {movement.unit}
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500">
                        {movement.referenceType && movement.referenceId
                          ? `${movement.referenceType} · ${movement.referenceId}`
                          : "Sin referencia"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

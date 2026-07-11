"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { materialService } from "@/services/material-service";
import { productTemplateService } from "@/services/product-template-service";
import type {
  ProductTemplateInputRecord,
  ProductTemplateSimulationRecord,
} from "@/types";

import {
  PRODUCT_TEMPLATE_INPUT_TYPE_LABELS,
  PRODUCT_TEMPLATE_LABOR_TYPE_LABELS,
  PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS,
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateSimulationProps = {
  canViewHistory: boolean;
  versionId: string;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatCurrencyValue = (amount: number | null): string => {
  if (amount === null) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-BO", {
    currency: "BOB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);
};

const getDefaultInputValue = (input: ProductTemplateInputRecord) => {
  if (input.defaultValueJson !== null) {
    return input.defaultValueJson;
  }

  switch (input.inputType) {
    case "BOOLEAN":
      return false;
    case "NUMBER":
      return 0;
    default:
      return "";
  }
};

export function ProductTemplateSimulation({
  canViewHistory,
  versionId,
}: ProductTemplateSimulationProps) {
  const [inputValuesOverride, setInputValuesOverride] = useState<Record<string, unknown> | null>(
    null,
  );
  const [latestSimulation, setLatestSimulation] = useState<ProductTemplateSimulationRecord | null>(
    null,
  );
  const versionQuery = useQuery({
    queryFn: async () => productTemplateService.getTemplateVersionById(versionId),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.version(versionId),
  });
  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["materials", "product-template-simulation-options"],
  });
  const historyQuery = useQuery({
    enabled: canViewHistory,
    queryFn: async () =>
      productTemplateService.listTemplateVersionSimulations(versionId, {
        page: 1,
        perPage: 10,
      }),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.simulations(versionId, {
      page: 1,
      perPage: 10,
    }),
  });
  const simulateMutation = useMutation({
    mutationFn: async () =>
      productTemplateService.simulateTemplateVersion(versionId, inputValues),
  });
  const defaultInputValues = Object.fromEntries(
    (versionQuery.data?.inputs ?? []).map((input) => [input.key, getDefaultInputValue(input)]),
  );

  if (versionQuery.isLoading || materialsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando simulador" />;
  }

  if (versionQuery.isError || materialsQuery.isError || !versionQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                versionQuery.refetch(),
                materialsQuery.refetch(),
                historyQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          versionQuery.error?.message ??
          materialsQuery.error?.message ??
          "No se pudo preparar el simulador."
        }
        title="La configuración de simulación falló"
      />
    );
  }

  const version = versionQuery.data;
  const materials = materialsQuery.data ?? [];
  const inputValues = inputValuesOverride ?? defaultInputValues;
  const simulation = latestSimulation;
  const history = historyQuery.data?.data ?? [];

  const renderInput = (input: ProductTemplateInputRecord) => {
    const value = inputValues[input.key];

    switch (input.inputType) {
      case "BOOLEAN":
        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              setInputValuesOverride((current) => ({
                ...(current ?? defaultInputValues),
                [input.key]: event.target.value === "true",
              }));
            }}
            value={String(Boolean(value))}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      case "MATERIAL_SELECT":
        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              setInputValuesOverride((current) => ({
                ...(current ?? defaultInputValues),
                [input.key]: event.target.value,
              }));
            }}
            value={typeof value === "string" ? value : ""}
          >
            <option value="">Seleccione un material</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} ({material.code})
              </option>
            ))}
          </select>
        );

      case "NUMBER":
        return (
          <input
            className={fieldClassName}
            onChange={(event) => {
              setInputValuesOverride((current) => ({
                ...(current ?? defaultInputValues),
                [input.key]: event.target.value,
              }));
            }}
            type="number"
            value={typeof value === "number" || typeof value === "string" ? value : ""}
          />
        );

      case "SELECT": {
        const options = Array.isArray(input.optionsJson) ? input.optionsJson : [];

        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              setInputValuesOverride((current) => ({
                ...(current ?? defaultInputValues),
                [input.key]: event.target.value,
              }));
            }}
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
          >
            <option value="">Seleccione una opción</option>
            {options.map((option, index) => {
              if (
                option &&
                typeof option === "object" &&
                !Array.isArray(option) &&
                "value" in option
              ) {
                return (
                  <option key={`${input.id}-${index}`} value={String(option.value)}>
                    {String("label" in option ? option.label : option.value)}
                  </option>
                );
              }

              return (
                <option key={`${input.id}-${index}`} value={String(option)}>
                  {String(option)}
                </option>
              );
            })}
          </select>
        );
      }

      case "TEXT":
        return (
          <input
            className={fieldClassName}
            onChange={(event) => {
              setInputValuesOverride((current) => ({
                ...(current ?? defaultInputValues),
                [input.key]: event.target.value,
              }));
            }}
            value={typeof value === "string" ? value : ""}
          />
        );
    }
  };

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              className="inline-flex items-center text-sm font-medium text-stone-600 transition hover:text-stone-950"
              href={PRODUCT_TEMPLATES_ROUTES.versionView(versionId)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a versión
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Simulación
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                V{version.versionNumber} · {version.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                Esta simulación ejecuta las fórmulas configuradas, estima los costos actuales de
                los materiales cuando hay precios disponibles y guarda el resultado sin crear una
                cotización. Para obtener la distribución óptima de las láminas y los retazos,
                agrega el producto a una cotización y ejecuta la optimización de corte.
              </p>
            </div>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                versionQuery.refetch(),
                materialsQuery.refetch(),
                historyQuery.refetch(),
              ]);
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </button>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Entradas
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Formulario de entradas
          </h2>
        </div>

        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();

            try {
              const result = await simulateMutation.mutateAsync();
              setLatestSimulation(result);
              if (canViewHistory) {
                void historyQuery.refetch();
              }
            } catch (error) {
              window.alert(error instanceof Error ? error.message : "La simulación falló.");
            }
          }}
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {version.inputs.map((input) => (
              <label key={input.id} className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  {input.label} · {PRODUCT_TEMPLATE_INPUT_TYPE_LABELS[input.inputType]}
                </span>
                {renderInput(input)}
                {input.unit ? <span className="text-xs text-stone-500">{input.unit}</span> : null}
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <button className={primaryButtonClassName} disabled={simulateMutation.isPending} type="submit">
                Ejecutar simulación
            </button>
          </div>
        </form>
      </section>

      {!simulation ? (
        <EmptyState
          description="Ejecuta la primera simulación para ver el uso de materiales, cortes, mano de obra y una vista previa de precios."
          title="Aún no se ha ejecutado ninguna simulación"
        />
      ) : (
        <>
          <section className={sectionClassName}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Subtotal</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.subtotalCost)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Costo de desperdicio</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.wasteCost)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Costo de mano de obra</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.laborCost)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Precio de venta sugerido</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.suggestedSalePrice)}
                </p>
              </div>
            </div>
          </section>

          <section className={tableWrapperClassName}>
            <div className="border-b border-stone-200/80 px-5 py-4">
              <h2 className="text-xl font-semibold text-stone-950">Desglose de materiales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Material</th>
                    <th className="px-5 py-4 font-semibold">Regla</th>
                    <th className="px-5 py-4 font-semibold">Cantidad</th>
                    <th className="px-5 py-4 font-semibold">Costo unitario</th>
                    <th className="px-5 py-4 font-semibold">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.resultJson.materials.map((item) => (
                    <tr key={`${item.materialId}-${item.ruleType}`} className="border-t border-stone-200/80">
                      <td className="px-5 py-4">
                        <p className="font-medium text-stone-950">{item.materialName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                          {item.materialCode}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS[item.ruleType]}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {item.requiredQuantity} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {item.estimatedUnitCost === null
                          ? "No disponible"
                          : formatCurrencyValue(item.estimatedUnitCost)}
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-950">
                        {formatCurrencyValue(item.estimatedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className={sectionClassName}>
              <h2 className="text-xl font-semibold text-stone-950">Cortes lineales</h2>
              {simulation.resultJson.cuts.linear.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {simulation.resultJson.cuts.linear.map((item) => (
                    <div key={`${item.label}-${item.materialId}`} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                      <p className="font-medium text-stone-950">{item.label}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.quantity} piezas · {item.requiredLengthMm} mm cada una · Desperdicio{" "}
                        {item.wastePercent}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-600">Esta simulación no generó cortes lineales.</p>
              )}
            </div>

            <div className={sectionClassName}>
              <h2 className="text-xl font-semibold text-stone-950">Cortes de lámina</h2>
              {simulation.resultJson.cuts.sheets.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {simulation.resultJson.cuts.sheets.map((item) => (
                    <div key={`${item.label}-${item.materialId}`} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                      <p className="font-medium text-stone-950">{item.label}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.quantity} piezas · {item.requiredWidthMm} × {item.requiredHeightMm} mm
                        {item.thicknessMm ? ` · ${item.thicknessMm} mm` : ""} · Desperdicio {item.wastePercent}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-600">Esta simulación no generó cortes de lámina.</p>
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <h2 className="text-xl font-semibold text-stone-950">Desglose de mano de obra</h2>
            {simulation.resultJson.labor.length > 0 ? (
              <div className="mt-4 space-y-3">
                {simulation.resultJson.labor.map((item) => (
                  <div key={item.label} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                    <p className="font-medium text-stone-950">{item.label}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {PRODUCT_TEMPLATE_LABOR_TYPE_LABELS[item.laborType]} · {item.quantity} × {formatCurrencyValue(item.unitCost)} ={" "}
                      {formatCurrencyValue(item.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-600">Ninguna regla de mano de obra aportó datos a esta simulación.</p>
            )}
          </section>

          {simulation.resultJson.warnings.length > 0 ? (
            <section className={sectionClassName}>
              <h2 className="text-xl font-semibold text-stone-950">Advertencias</h2>
              <ul className="mt-4 space-y-2 text-sm text-stone-700">
                {simulation.resultJson.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {canViewHistory ? (
        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold text-stone-950">Simulaciones recientes</h2>
          {history.length > 0 ? (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                  <p className="font-medium text-stone-950">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    Precio de venta sugerido: {formatCurrencyValue(item.resultJson.suggestedSalePrice)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-600">Aún no hay simulaciones guardadas.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

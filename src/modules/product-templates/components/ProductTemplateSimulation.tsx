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
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateSimulationProps = {
  canViewHistory: boolean;
  versionId: string;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatCurrencyValue = (amount: number | null): string => {
  if (amount === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
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
    return <LoadingState cards={4} title="Loading simulator" />;
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
            Retry
          </button>
        }
        description={
          versionQuery.error?.message ??
          materialsQuery.error?.message ??
          "The simulator could not be prepared."
        }
        title="Simulation setup failed"
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
            <option value="true">True</option>
            <option value="false">False</option>
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
            <option value="">Select material</option>
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
            <option value="">Select option</option>
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
              Back to version
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Simulation
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                V{version.versionNumber} · {version.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                This preview runs the safe formula engine, estimates current material costs when
                available, and stores a reusable simulation record without creating a quotation.
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
            Refresh
          </button>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Inputs
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Dynamic form
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
              window.alert(error instanceof Error ? error.message : "Simulation failed.");
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
              Run simulation
            </button>
          </div>
        </form>
      </section>

      {!simulation ? (
        <EmptyState
          description="Run the first simulation to see material usage, cuts, labor, and price preview output."
          title="No simulation has been run yet"
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
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Waste cost</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.wasteCost)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Labor cost</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.laborCost)}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Suggested sale</p>
                <p className="mt-3 text-lg font-semibold text-stone-950">
                  {formatCurrencyValue(simulation.resultJson.suggestedSalePrice)}
                </p>
              </div>
            </div>
          </section>

          <section className={tableWrapperClassName}>
            <div className="border-b border-stone-200/80 px-5 py-4">
              <h2 className="text-xl font-semibold text-stone-950">Material breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Material</th>
                    <th className="px-5 py-4 font-semibold">Rule</th>
                    <th className="px-5 py-4 font-semibold">Quantity</th>
                    <th className="px-5 py-4 font-semibold">Unit cost</th>
                    <th className="px-5 py-4 font-semibold">Cost</th>
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
                      <td className="px-5 py-4 text-stone-700">{item.ruleType}</td>
                      <td className="px-5 py-4 text-stone-700">
                        {item.requiredQuantity} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {item.estimatedUnitCost === null
                          ? "Unavailable"
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
              <h2 className="text-xl font-semibold text-stone-950">Linear cuts</h2>
              {simulation.resultJson.cuts.linear.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {simulation.resultJson.cuts.linear.map((item) => (
                    <div key={`${item.label}-${item.materialId}`} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                      <p className="font-medium text-stone-950">{item.label}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.quantity} pieces · {item.requiredLengthMm} mm each · Waste{" "}
                        {item.wastePercent}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-600">No linear cut output in this run.</p>
              )}
            </div>

            <div className={sectionClassName}>
              <h2 className="text-xl font-semibold text-stone-950">Sheet cuts</h2>
              {simulation.resultJson.cuts.sheets.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {simulation.resultJson.cuts.sheets.map((item) => (
                    <div key={`${item.label}-${item.materialId}`} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                      <p className="font-medium text-stone-950">{item.label}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {item.quantity} pieces · {item.requiredWidthMm} × {item.requiredHeightMm} mm
                        {item.thicknessMm ? ` · ${item.thicknessMm} mm` : ""} · Waste {item.wastePercent}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-600">No sheet cut output in this run.</p>
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <h2 className="text-xl font-semibold text-stone-950">Labor breakdown</h2>
            {simulation.resultJson.labor.length > 0 ? (
              <div className="mt-4 space-y-3">
                {simulation.resultJson.labor.map((item) => (
                  <div key={item.label} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                    <p className="font-medium text-stone-950">{item.label}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {item.laborType} · {item.quantity} × {formatCurrencyValue(item.unitCost)} ={" "}
                      {formatCurrencyValue(item.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-600">No labor rules contributed to this run.</p>
            )}
          </section>

          {simulation.resultJson.warnings.length > 0 ? (
            <section className={sectionClassName}>
              <h2 className="text-xl font-semibold text-stone-950">Warnings</h2>
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
          <h2 className="text-xl font-semibold text-stone-950">Recent simulations</h2>
          {history.length > 0 ? (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
                  <p className="font-medium text-stone-950">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    Suggested sale: {formatCurrencyValue(item.resultJson.suggestedSalePrice)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-600">No saved simulation history yet.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

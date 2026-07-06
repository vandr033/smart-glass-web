"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, RefreshCcw, Ruler } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import { profileOptimizationService } from "@/services/profile-optimization-service";
import { getApiErrorMessage } from "@/utils";

import {
  PROFILE_OPTIMIZATION_PERMISSIONS,
  PROFILE_OPTIMIZATION_QUERY_KEYS,
  PROFILE_OPTIMIZATION_ROUTES,
} from "../constants";
import {
  formatProfileMetersFromMm,
  formatProfilePercent,
  getProfileModeLabel,
  getProfileRunStatusBadge,
} from "../ui";

type QuotationProfileOptimizationPanelProps = {
  quotationId: string;
};

export function QuotationProfileOptimizationPanel({
  quotationId,
}: QuotationProfileOptimizationPanelProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canRun = permissions.includes(PROFILE_OPTIMIZATION_PERMISSIONS.run);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const requirementsQuery = useQuery({
    queryFn: () =>
      profileOptimizationService.getQuotationProfileRequirements(quotationId),
    queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.quotationRequirements(quotationId),
    staleTime: 60_000,
  });
  const runMutation = useMutation({
    mutationFn: () =>
      profileOptimizationService.runQuotationOptimization(quotationId, {
        mode: "COMMERCIAL_ESTIMATION",
      }),
    onSuccess: async () => {
      setFeedbackMessage("La estimacion comercial de perfiles se completo correctamente.");
      await queryClient.invalidateQueries({
        queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.quotationRequirements(quotationId),
      });
      await queryClient.invalidateQueries({
        queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.optimizations({ quotationId }),
      });
    },
    onError: (error) => {
      setFeedbackMessage(getApiErrorMessage(error));
    },
  });

  if (requirementsQuery.isPending) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5">
        <LoadingState title="Preparando requerimientos de perfiles" />
      </section>
    );
  }

  if (requirementsQuery.isError) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5">
        <ErrorState
          action={
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              onClick={() => {
                void requirementsQuery.refetch();
              }}
              type="button"
            >
              Reintentar
            </button>
          }
          description={requirementsQuery.error.message}
          title="No se pudieron extraer los requerimientos de perfiles"
        />
      </section>
    );
  }

  const requirements = requirementsQuery.data;
  const runs = runMutation.data?.runs ?? [];
  const totalCuts = requirements.groups.reduce((sum, group) => sum + group.totalCuts, 0);
  const totalLengthMm = requirements.groups.reduce(
    (sum, group) => sum + group.totalRequiredLengthMm,
    0,
  );

  return (
    <section className="rounded-lg border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92))] px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
            Perfiles de aluminio
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Requerimientos de perfiles de la cotizacion
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
            Los cortes lineales extraidos pueden estimarse durante la cotizacion para anticipar demanda de barras, desperdicio y necesidad de compra antes de comprometer inventario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={runMutation.isPending}
            onClick={() => {
              void requirementsQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </button>
          <button
            className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canRun || runMutation.isPending || requirements.groups.length === 0}
            onClick={() => {
              setFeedbackMessage(null);
              void runMutation.mutateAsync();
            }}
            type="button"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            Ejecutar estimacion comercial
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Materiales
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {requirements.groups.length}
          </p>
        </div>
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Cortes
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{totalCuts}</p>
        </div>
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Longitud estimada
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {formatProfileMetersFromMm(totalLengthMm)}
          </p>
        </div>
      </div>

      {requirements.warnings.length > 0 ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {requirements.warnings.join(" ")}
        </div>
      ) : null}

      {feedbackMessage ? (
        <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {feedbackMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {requirements.groups.map((group) => (
          <div
            key={group.materialId}
            className="rounded-lg border border-stone-200 bg-white px-4 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {group.material.code}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-950">
              {group.material.name}
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {group.totalCuts} cortes · {formatProfileMetersFromMm(group.totalRequiredLengthMm)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.cuts.slice(0, 4).map((cut) => (
                <span
                  key={`${group.materialId}-${cut.label}-${cut.lengthMm}`}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                >
                  {cut.label} · {cut.lengthMm.toFixed(0)} mm × {cut.quantity}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {runs.length > 0 ? (
        <div className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Ultimas corridas de estimacion
          </p>
          <div className="mt-3 grid gap-3">
            {runs.map((run) => {
              const badge = getProfileRunStatusBadge(run.status);

              return (
                <div
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] bg-stone-50 px-4 py-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-sm font-semibold text-stone-950">
                        {run.code}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {run.material.name} · {getProfileModeLabel(run.mode)} · Desperdicio{" "}
                      {formatProfilePercent(run.wastePercent)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                    href={PROFILE_OPTIMIZATION_ROUTES.optimizationDetail(run.id)}
                  >
                    <Ruler className="mr-2 h-4 w-4" />
                    Abrir corrida
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

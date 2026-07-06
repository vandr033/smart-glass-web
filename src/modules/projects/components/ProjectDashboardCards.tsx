"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Factory,
  Hammer,
  Layers3,
  Quote,
} from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatCard } from "@/components/ui/stat-card";
import { projectService } from "@/services/project-service";

import { PROJECTS_QUERY_KEYS, PROJECTS_ROUTES } from "../constants";

export function ProjectDashboardCards() {
  const summaryQuery = useQuery({
    queryFn: projectService.getDashboardSummary,
    queryKey: PROJECTS_QUERY_KEYS.dashboard,
    staleTime: 30_000,
  });

  if (summaryQuery.isLoading) {
    return <LoadingState cards={5} title="Cargando indicadores del panel comercial" />;
  }

  if (summaryQuery.isError) {
    return (
      <ErrorState
        description={summaryQuery.error.message}
        title="No se pudieron cargar los indicadores del panel"
      />
    );
  }

  const summary = summaryQuery.data;

  if (!summary) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        description="Trabajos activos entre ingreso comercial, cotizacion, compras y ejecucion."
        href={PROJECTS_ROUTES.list}
        icon={Layers3}
        label="Proyectos activos"
        tone="accent"
        value={String(summary.activeProjects)}
      />
      <StatCard
        description="Proyectos que esperan una cotizacion o una revision comercial final."
        href={PROJECTS_ROUTES.list}
        icon={Quote}
        label="Cotizaciones pendientes"
        value={String(summary.pendingQuotationProjects)}
      />
      <StatCard
        description="Trabajos aprobados listos para compras y preparacion operativa."
        href={PROJECTS_ROUTES.list}
        icon={ClipboardList}
        label="Proyectos aprobados"
        value={String(summary.approvedProjects)}
      />
      <StatCard
        description="Proyectos que ya se encuentran dentro del frente productivo."
        href={PROJECTS_ROUTES.list}
        icon={Factory}
        label="En produccion"
        value={String(summary.projectsInProduction)}
      />
      <StatCard
        description="Trabajos listos para coordinacion de cuadrillas e instalacion."
        href={PROJECTS_ROUTES.list}
        icon={Hammer}
        label="Instalaciones programadas"
        value={String(summary.pendingInstallationProjects)}
      />
    </section>
  );
}

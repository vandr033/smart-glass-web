"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  MapPinned,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";
import { installationService } from "@/services/installation-service";
import { projectService } from "@/services/project-service";
import { quotationService } from "@/services/quotation-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

import {
  EMPTY_INSTALLATION_ORDER_FORM_VALUES,
  EMPTY_INSTALLATION_TEAM_FORM_VALUES,
  installationOrderFormSchema,
  installationTeamFormSchema,
  toInstallationOrderPayload,
  toInstallationTeamPayload,
  type InstallationOrderFormValues,
  type InstallationTeamFormValues,
} from "../forms";
import {
  INSTALLATION_CALENDAR_VIEW_LABELS,
  INSTALLATION_LABELS,
  INSTALLATION_PERMISSIONS,
  INSTALLATION_PRIORITY_OPTIONS,
  INSTALLATION_QUERY_KEYS,
  INSTALLATION_ROUTES,
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_OPTIONS,
  INSTALLATION_TEAM_ROLE_LABELS,
  INSTALLATION_TEAM_ROLE_OPTIONS,
  INSTALLATION_TEAM_STATUS_OPTIONS,
  INSTALLATION_TYPE_OPTIONS,
} from "../constants";
import {
  buildMapLink,
  formatInstallationDate,
  formatInstallationScheduleWindow,
  getInstallationPriorityBadge,
  getInstallationStatusBadge,
} from "../ui";

import type {
  InstallationCalendarView,
  InstallationOrderListItem,
  InstallationTeamRecord,
} from "@/types";

const DAY_NAME_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  weekday: "short",
});

const DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
});

const monthAnchor = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));

const addDaysUtc = (value: Date, days: number) => {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const addMonthsUtc = (value: Date, months: number) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));

const startOfWeekUtc = (value: Date) => {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const weekDay = date.getUTCDay();
  const offset = weekDay === 0 ? -6 : 1 - weekDay;
  return addDaysUtc(date, offset);
};

const formatDateInput = (value: Date) => value.toISOString().slice(0, 10);

const isSameDayUtc = (left: Date, right: Date) =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth() &&
  left.getUTCDate() === right.getUTCDate();

const getCalendarRange = (view: InstallationCalendarView, anchorDate: Date) => {
  if (view === "day") {
    return {
      dateFrom: formatDateInput(anchorDate),
      dateTo: formatDateInput(anchorDate),
    };
  }

  if (view === "week") {
    const start = startOfWeekUtc(anchorDate);
    const end = addDaysUtc(start, 6);

    return {
      dateFrom: formatDateInput(start),
      dateTo: formatDateInput(end),
    };
  }

  const monthStart = monthAnchor(anchorDate);
  const gridStart = startOfWeekUtc(monthStart);
  const gridEnd = addDaysUtc(gridStart, 41);

  return {
    dateFrom: formatDateInput(gridStart),
    dateTo: formatDateInput(gridEnd),
  };
};

const groupOrdersByDate = (orders: InstallationOrderListItem[]) => {
  return orders.reduce<Record<string, InstallationOrderListItem[]>>((result, order) => {
    const dateKey = order.scheduledDate.slice(0, 10);
    const currentItems = result[dateKey] ?? [];
    currentItems.push(order);
    result[dateKey] = currentItems.sort((left, right) =>
      (left.scheduledStartTime ?? "").localeCompare(right.scheduledStartTime ?? ""),
    );
    return result;
  }, {});
};

const loadTeamIntoForm = (
  team: Exclude<InstallationTeamRecord, null>,
  onLoad: (values: InstallationTeamFormValues) => void,
) => {
  onLoad({
    member1Role: team.members[0]?.role ?? "LIDER",
    member1UserId: team.members[0]?.user?.id ?? "",
    member2Role: team.members[1]?.role ?? "TECNICO",
    member2UserId: team.members[1]?.user?.id ?? "",
    member3Role: team.members[2]?.role ?? "APOYO",
    member3UserId: team.members[2]?.user?.id ?? "",
    name: team.name,
    notes: team.notes ?? "",
    status: team.status,
    supervisorId: team.supervisor?.id ?? "",
  });
};

const TEAM_MEMBER_FIELD_CONFIGS = [
  { key: "miembro-1", roleKey: "member1Role", userKey: "member1UserId" },
  { key: "miembro-2", roleKey: "member2Role", userKey: "member2UserId" },
  { key: "miembro-3", roleKey: "member3Role", userKey: "member3UserId" },
] as const;

export default function InstallationHomePage() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(INSTALLATION_PERMISSIONS.create);
  const canAssign = permissions.includes(INSTALLATION_PERMISSIONS.assign);
  const canExport = permissions.includes(INSTALLATION_PERMISSIONS.export);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<keyof typeof INSTALLATION_STATUS_LABELS | "">("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [calendarView, setCalendarView] = useState<InstallationCalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const orderForm = useForm<InstallationOrderFormValues>({
    defaultValues: EMPTY_INSTALLATION_ORDER_FORM_VALUES,
    resolver: zodResolver(installationOrderFormSchema) as Resolver<InstallationOrderFormValues>,
  });
  const teamForm = useForm<InstallationTeamFormValues>({
    defaultValues: EMPTY_INSTALLATION_TEAM_FORM_VALUES,
    resolver: zodResolver(installationTeamFormSchema) as Resolver<InstallationTeamFormValues>,
  });

  const selectedOrderClientId = useWatch({
    control: orderForm.control,
    name: "clientId",
  });
  const selectedProjectId = useWatch({
    control: orderForm.control,
    name: "projectId",
  });
  const selectedQuotationId = useWatch({
    control: orderForm.control,
    name: "quotationId",
  });

  const calendarRange = useMemo(
    () => getCalendarRange(calendarView, anchorDate),
    [anchorDate, calendarView],
  );

  const teamsQuery = useQuery({
    queryFn: installationService.listTeams,
    queryKey: INSTALLATION_QUERY_KEYS.teams,
    staleTime: 60_000,
  });

  const clientsQuery = useQuery({
    queryFn: async () => {
      const result = await clientService.listClients({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["installations", "client-options"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["installations", "project-options"],
    staleTime: 60_000,
  });

  const quotationsQuery = useQuery({
    queryFn: async () => {
      const result = await quotationService.listQuotations({
        page: 1,
        perPage: 100,
        sortBy: "updatedAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["installations", "quotation-options"],
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["installations", "user-options"],
    staleTime: 60_000,
  });

  const addressesQuery = useQuery({
    enabled: selectedOrderClientId.trim().length > 0,
    queryFn: () => clientService.listClientAddresses(selectedOrderClientId),
    queryKey: ["installations", "addresses", selectedOrderClientId],
    staleTime: 60_000,
  });

  const ordersQuery = useQuery({
    queryFn: () =>
      installationService.listOrders({
        clientId: clientId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: 12,
        projectId: projectId || undefined,
        search,
        sortBy: "scheduledDate",
        sortDirection: "asc",
        status: status || undefined,
        teamId: teamId || undefined,
      }),
    queryKey: INSTALLATION_QUERY_KEYS.orders({
      clientId,
      dateFrom,
      dateTo,
      page,
      projectId,
      search,
      status,
      teamId,
    }),
  });

  const calendarQuery = useQuery({
    queryFn: () =>
      installationService.listCalendar({
        clientId: clientId || undefined,
        dateFrom: calendarRange.dateFrom,
        dateTo: calendarRange.dateTo,
        projectId: projectId || undefined,
        status: status || undefined,
        teamId: teamId || undefined,
        view: calendarView,
      }),
    queryKey: INSTALLATION_QUERY_KEYS.calendar({
      anchorDate: anchorDate.toISOString(),
      calendarView,
      clientId,
      projectId,
      status,
      teamId,
    }),
    staleTime: 30_000,
  });

  const createTeamMutation = useMutation({
    mutationFn: installationService.createTeam,
    onSuccess: async () => {
      setEditingTeamId(null);
      teamForm.reset(EMPTY_INSTALLATION_TEAM_FORM_VALUES);
      await queryClient.invalidateQueries({
        queryKey: ["installations"],
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (input: { teamId: string; values: InstallationTeamFormValues }) =>
      installationService.updateTeam(input.teamId, toInstallationTeamPayload(input.values)),
    onSuccess: async () => {
      setEditingTeamId(null);
      teamForm.reset(EMPTY_INSTALLATION_TEAM_FORM_VALUES);
      await queryClient.invalidateQueries({
        queryKey: ["installations"],
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (values: InstallationOrderFormValues) => {
      const payload = toInstallationOrderPayload(values);

      if (payload.quotationId) {
        return installationService.createOrderFromQuotation(payload.quotationId, payload);
      }

      if (payload.projectId) {
        return installationService.createOrderFromProject(payload.projectId, payload);
      }

      return installationService.createOrder(payload);
    },
    onSuccess: async () => {
      orderForm.reset({
        ...EMPTY_INSTALLATION_ORDER_FORM_VALUES,
        clientId: selectedOrderClientId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["installations"],
      });
    },
  });

  useEffect(() => {
    if (!selectedProjectId || !projectsQuery.data) {
      return;
    }

    const project = projectsQuery.data.find((item) => item.id === selectedProjectId);

    if (project?.client.id) {
      orderForm.setValue("clientId", project.client.id);
    }
  }, [orderForm, projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    if (!selectedQuotationId || !quotationsQuery.data) {
      return;
    }

    const quotation = quotationsQuery.data.find((item) => item.id === selectedQuotationId);

    if (quotation?.client.id) {
      orderForm.setValue("clientId", quotation.client.id);
    }

    if (quotation?.project?.id) {
      orderForm.setValue("projectId", quotation.project.id);
    }
  }, [orderForm, quotationsQuery.data, selectedQuotationId]);

  const refreshAll = async () => {
    await Promise.all([
      teamsQuery.refetch(),
      clientsQuery.refetch(),
      projectsQuery.refetch(),
      quotationsQuery.refetch(),
      usersQuery.refetch(),
      ordersQuery.refetch(),
      calendarQuery.refetch(),
      selectedOrderClientId ? addressesQuery.refetch() : Promise.resolve(),
    ]);
  };

  if (
    teamsQuery.isPending ||
    clientsQuery.isPending ||
    projectsQuery.isPending ||
    quotationsQuery.isPending ||
    usersQuery.isPending
  ) {
    return <LoadingState title="Cargando centro de instalaciones" />;
  }

  if (
    teamsQuery.isError ||
    clientsQuery.isError ||
    projectsQuery.isError ||
    quotationsQuery.isError ||
    usersQuery.isError
  ) {
    return (
      <ErrorState
        action={
          <button className={secondaryButtonClassName} onClick={() => void refreshAll()} type="button">
            Reintentar
          </button>
        }
        description={
          teamsQuery.error?.message ??
          clientsQuery.error?.message ??
          projectsQuery.error?.message ??
          quotationsQuery.error?.message ??
          usersQuery.error?.message ??
          "No se pudo preparar el modulo de instalaciones."
        }
        title="No se pudo cargar el contexto del modulo"
      />
    );
  }

  const orders = ordersQuery.data?.data ?? [];
  const pagination = ordersQuery.data?.pagination;
  const calendarOrders = calendarQuery.data ?? [];
  const ordersByDate = groupOrdersByDate(calendarOrders);
  const selectedDayOrders = ordersByDate[formatDateInput(anchorDate)] ?? [];
  const addressOptions = addressesQuery.data ?? [];
  const monthGridStart = startOfWeekUtc(monthAnchor(anchorDate));
  const weekStart = startOfWeekUtc(anchorDate);

  const monthDays = Array.from({ length: 42 }, (_, index) => addDaysUtc(monthGridStart, index));

  const weekDays = Array.from({ length: 7 }, (_, index) => addDaysUtc(weekStart, index));
  const calendarHeaderDates =
    calendarView === "month" ? weekDays : calendarView === "week" ? weekDays : [anchorDate];

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            {canExport ? (
              <ExportMenu
                buttonClassName={secondaryButtonClassName}
                disabled={orders.length === 0}
                onExportExcel={() => {
                  exportRowsToExcel(orders, {
                    columns: [
                      { header: "Codigo", value: (row) => row.code },
                      { header: "Estado", value: (row) => INSTALLATION_STATUS_LABELS[row.status] },
                      { header: "Cuadrilla", value: (row) => row.assignedTeam?.name ?? "Sin cuadrilla" },
                      { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                      { header: "Cliente", value: (row) => row.client.displayName },
                      {
                        header: "Ventana",
                        value: (row) =>
                          formatInstallationScheduleWindow(
                            row.scheduledDate,
                            row.scheduledStartTime,
                            row.scheduledEndTime,
                          ),
                      },
                      {
                        header: "Preparacion",
                        value: (row) =>
                          row.readiness.warnings.length === 0
                            ? "Lista"
                            : row.readiness.warnings.join(" | "),
                      },
                    ],
                    fileName: "cronograma-instalaciones.xls",
                    title: INSTALLATION_LABELS.exports.schedule,
                  });
                }}
                onExportPdf={() => {
                  exportRowsToPdf(orders, {
                    columns: [
                      { header: "Codigo", value: (row) => row.code },
                      { header: "Estado", value: (row) => INSTALLATION_STATUS_LABELS[row.status] },
                      { header: "Cliente", value: (row) => row.client.displayName },
                      { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                      {
                        header: "Ventana",
                        value: (row) =>
                          formatInstallationScheduleWindow(
                            row.scheduledDate,
                            row.scheduledStartTime,
                            row.scheduledEndTime,
                          ),
                      },
                    ],
                    title: INSTALLATION_LABELS.exports.schedule,
                  });
                }}
              />
            ) : null}
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void refreshAll();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {INSTALLATION_LABELS.buttons.refresh}
            </button>
          </div>
        }
        description={INSTALLATION_LABELS.page.description}
        eyebrow={INSTALLATION_LABELS.page.eyebrow}
        title={INSTALLATION_LABELS.page.title}
      />

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <form
            className="grid gap-5"
            onSubmit={orderForm.handleSubmit(async (values) => {
              try {
                await createOrderMutation.mutateAsync(values);
              } catch (error) {
                orderForm.setError("root", {
                  message: getApiErrorMessage(error),
                });
              }
            })}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Programacion
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Orden de instalacion
                </h2>
              </div>
              <CalendarDays className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cliente</span>
                <select className={fieldClassName} {...orderForm.register("clientId")}>
                  <option value="">Selecciona un cliente</option>
                  {clientsQuery.data?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Proyecto</span>
                <select className={fieldClassName} {...orderForm.register("projectId")}>
                  <option value="">Sin proyecto</option>
                  {projectsQuery.data?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code} | {project.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cotizacion</span>
                <select className={fieldClassName} {...orderForm.register("quotationId")}>
                  <option value="">Sin cotizacion</option>
                  {quotationsQuery.data?.map((quotation) => (
                    <option key={quotation.id} value={quotation.id}>
                      {quotation.code}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Direccion</span>
                <select className={fieldClassName} {...orderForm.register("addressId")}>
                  <option value="">Sin direccion enlazada</option>
                  {addressOptions.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} | {address.address}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cuadrilla</span>
                <select className={fieldClassName} {...orderForm.register("assignedTeamId")}>
                  <option value="">Sin cuadrilla</option>
                  {teamsQuery.data?.filter(Boolean).map((team) => (
                    <option key={team!.id} value={team!.id}>
                      {team!.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Supervisor</span>
                <select className={fieldClassName} {...orderForm.register("assignedSupervisorId")}>
                  <option value="">Sin supervisor</option>
                  {usersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Fecha</span>
                <input className={fieldClassName} type="date" {...orderForm.register("scheduledDate")} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Inicio</span>
                <input className={fieldClassName} type="time" {...orderForm.register("scheduledStartTime")} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Fin</span>
                <input className={fieldClassName} type="time" {...orderForm.register("scheduledEndTime")} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Prioridad</span>
                <select className={fieldClassName} {...orderForm.register("priority")}>
                  {INSTALLATION_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tipo</span>
                <select className={fieldClassName} {...orderForm.register("installationType")}>
                  {INSTALLATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Notas internas</span>
              <textarea className={textAreaClassName} {...orderForm.register("notes")} />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  descriptionKey: "task1Description" as const,
                  minutesKey: "task1EstimatedMinutes" as const,
                  title: "Tarea 1",
                  titleKey: "task1Title" as const,
                },
                {
                  descriptionKey: "task2Description" as const,
                  minutesKey: "task2EstimatedMinutes" as const,
                  title: "Tarea 2",
                  titleKey: "task2Title" as const,
                },
                {
                  descriptionKey: "task3Description" as const,
                  minutesKey: "task3EstimatedMinutes" as const,
                  title: "Tarea 3",
                  titleKey: "task3Title" as const,
                },
              ].map((task) => (
                <div key={task.title} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {task.title}
                  </p>
                  <input
                    className={`${fieldClassName} mt-3`}
                    placeholder="Titulo"
                    {...orderForm.register(task.titleKey)}
                  />
                  <input
                    className={`${fieldClassName} mt-3`}
                    placeholder="Minutos estimados"
                    {...orderForm.register(task.minutesKey)}
                  />
                  <textarea
                    className={`${textAreaClassName} mt-3 min-h-24`}
                    placeholder="Descripcion"
                    {...orderForm.register(task.descriptionKey)}
                  />
                </div>
              ))}
            </div>

            {orderForm.formState.errors.root?.message ? (
              <p className="text-sm text-rose-700">{orderForm.formState.errors.root.message}</p>
            ) : null}

            {canCreate ? (
              <button className={primaryButtonClassName} disabled={createOrderMutation.isPending} type="submit">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {INSTALLATION_LABELS.buttons.createOrder}
              </button>
            ) : null}
          </form>

          <form
            className="grid gap-5"
            onSubmit={teamForm.handleSubmit(async (values) => {
              try {
                if (editingTeamId) {
                  await updateTeamMutation.mutateAsync({
                    teamId: editingTeamId,
                    values,
                  });
                  return;
                }

                await createTeamMutation.mutateAsync(toInstallationTeamPayload(values));
              } catch (error) {
                teamForm.setError("root", {
                  message: getApiErrorMessage(error),
                });
              }
            })}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Cuadrillas
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Gestion de equipos
                </h2>
              </div>
              <Users className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Nombre</span>
              <input className={fieldClassName} {...teamForm.register("name")} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Supervisor</span>
                <select className={fieldClassName} {...teamForm.register("supervisorId")}>
                  <option value="">Sin supervisor</option>
                  {usersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Estado</span>
                <select className={fieldClassName} {...teamForm.register("status")}>
                  {INSTALLATION_TEAM_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {TEAM_MEMBER_FIELD_CONFIGS.map((member) => {
              return (
                <div key={member.key} className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-3 md:grid-cols-[0.8fr_1.2fr]">
                  <select className={fieldClassName} {...teamForm.register(member.roleKey)}>
                    {INSTALLATION_TEAM_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {INSTALLATION_TEAM_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <select className={fieldClassName} {...teamForm.register(member.userKey)}>
                    <option value="">Sin asignar</option>
                    {usersQuery.data?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Notas</span>
              <textarea className={textAreaClassName} {...teamForm.register("notes")} />
            </label>

            {teamForm.formState.errors.root?.message ? (
              <p className="text-sm text-rose-700">{teamForm.formState.errors.root.message}</p>
            ) : null}

            {canAssign ? (
              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                  type="submit"
                >
                  {editingTeamId ? "Actualizar cuadrilla" : INSTALLATION_LABELS.buttons.createTeam}
                </button>
                {editingTeamId ? (
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setEditingTeamId(null);
                      teamForm.reset(EMPTY_INSTALLATION_TEAM_FORM_VALUES);
                    }}
                    type="button"
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3">
              {(teamsQuery.data ?? []).filter(Boolean).map((team) => (
                <div key={team!.id} className="rounded-md border border-stone-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{team!.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {team!.supervisor?.name ?? "Sin supervisor"} | {team!.members.length} integrantes
                      </p>
                    </div>
                    {canAssign ? (
                      <button
                        className={secondaryButtonClassName}
                        onClick={() => {
                          setEditingTeamId(team!.id);
                          loadTeamIntoForm(team!, (values) => teamForm.reset(values));
                        }}
                        type="button"
                      >
                        Cargar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Agenda
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Calendario de instalaciones
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setAnchorDate((current) =>
                  calendarView === "month"
                    ? addMonthsUtc(current, -1)
                    : addDaysUtc(current, calendarView === "week" ? -7 : -1),
                );
              }}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setAnchorDate(new Date());
              }}
              type="button"
            >
              Hoy
            </button>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setAnchorDate((current) =>
                  calendarView === "month"
                    ? addMonthsUtc(current, 1)
                    : addDaysUtc(current, calendarView === "week" ? 7 : 1),
                );
              }}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex overflow-hidden rounded-md border border-stone-200">
              {(["day", "week", "month"] as InstallationCalendarView[]).map((view) => (
                <button
                  key={view}
                  className={
                    calendarView === view
                      ? "bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
                      : "bg-white px-3 py-2 text-sm font-semibold text-stone-700"
                  }
                  onClick={() => {
                    setCalendarView(view);
                  }}
                  type="button"
                >
                  {INSTALLATION_CALENDAR_VIEW_LABELS[view]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {calendarQuery.isPending ? (
          <LoadingState title="Cargando agenda de instalaciones" />
        ) : calendarQuery.isError ? (
          <ErrorState
            description={calendarQuery.error.message}
            title="No se pudo cargar la agenda"
          />
        ) : calendarOrders.length === 0 ? (
          <EmptyState
            description={INSTALLATION_LABELS.emptyStates.calendarDescription}
            title={INSTALLATION_LABELS.emptyStates.calendarTitle}
          />
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
            <div className="overflow-hidden rounded-md border border-stone-200">
              <div
                className={`grid bg-stone-100 ${
                  calendarView === "day" ? "grid-cols-1" : "grid-cols-7"
                }`}
              >
                {calendarHeaderDates.map((date, index) => (
                  <div key={`${date.toISOString()}-${index}`} className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
                    {DAY_NAME_FORMATTER.format(date)}
                  </div>
                ))}
              </div>

              {calendarView === "month" ? (
                <div className="grid grid-cols-7">
                  {monthDays.map((date) => {
                    const dateKey = formatDateInput(date);
                    const items = ordersByDate[dateKey] ?? [];
                    const isCurrentMonth = date.getUTCMonth() === anchorDate.getUTCMonth();

                    return (
                      <div
                        key={dateKey}
                        className={`min-h-40 border-b border-r border-stone-200 px-3 py-3 ${isCurrentMonth ? "bg-white" : "bg-stone-50"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            className={`text-sm font-semibold ${isSameDayUtc(date, anchorDate) ? "text-[color:var(--color-primary)]" : "text-stone-700"}`}
                            onClick={() => {
                              setAnchorDate(date);
                              setCalendarView("day");
                            }}
                            type="button"
                          >
                            {DAY_NUMBER_FORMATTER.format(date)}
                          </button>
                          <span className="text-xs text-stone-500">{items.length}</span>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {items.slice(0, 3).map((order) => {
                            const statusBadge = getInstallationStatusBadge(order.status);

                            return (
                              <Link
                                key={order.id}
                                className="rounded-md border border-stone-200 bg-stone-50 px-2 py-2 text-left text-xs"
                                href={INSTALLATION_ROUTES.detail(order.id)}
                              >
                                <p className="font-semibold text-stone-950">{order.code}</p>
                                <p className="mt-1 text-stone-600">
                                  {order.scheduledStartTime ?? "Jornada"} | {order.client.displayName}
                                </p>
                                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`grid ${calendarView === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
                  {(calendarView === "week" ? weekDays : [anchorDate]).map((date) => {
                    const dateKey = formatDateInput(date);
                    const items = ordersByDate[dateKey] ?? [];

                    return (
                      <div key={dateKey} className="min-h-52 border-r border-stone-200 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            className="text-sm font-semibold text-stone-900"
                            onClick={() => {
                              setAnchorDate(date);
                              setCalendarView("day");
                            }}
                            type="button"
                          >
                            {DAY_NUMBER_FORMATTER.format(date)}
                          </button>
                          <span className="text-xs text-stone-500">{items.length}</span>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {items.map((order) => {
                            const statusBadge = getInstallationStatusBadge(order.status);

                            return (
                              <Link
                                key={order.id}
                                className="rounded-md border border-stone-200 bg-stone-50 px-2 py-2 text-left text-xs"
                                href={INSTALLATION_ROUTES.detail(order.id)}
                              >
                                <p className="font-semibold text-stone-950">{order.code}</p>
                                <p className="mt-1 text-stone-600">
                                  {order.scheduledStartTime ?? "Jornada"} | {order.assignedTeam?.name ?? "Sin cuadrilla"}
                                </p>
                                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-md border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <MapPinned className="h-4 w-4 text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Ruta del dia
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-stone-950">
                      {formatInstallationDate(anchorDate.toISOString())}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {selectedDayOrders.length === 0 ? (
                    <p className="text-sm text-stone-600">
                      No hay visitas programadas para la fecha seleccionada.
                    </p>
                  ) : (
                    selectedDayOrders.map((order) => {
                      const mapLink = buildMapLink({
                        address: order.address.address,
                        latitude: order.address.latitude,
                        longitude: order.address.longitude,
                      });
                      const priorityBadge = getInstallationPriorityBadge(order.priority);

                      return (
                        <div key={order.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-stone-950">{order.code}</p>
                              <p className="text-xs text-stone-600">{order.client.displayName}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${priorityBadge.className}`}>
                              {priorityBadge.label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-stone-700">
                            {order.address.address ?? "Sin direccion"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {mapLink ? (
                              <a
                                className={secondaryButtonClassName}
                                href={mapLink}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Ver mapa
                              </a>
                            ) : null}
                            <Link className={secondaryButtonClassName} href={INSTALLATION_ROUTES.detail(order.id)}>
                              Abrir detalle
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Cola operativa
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Ordenes programadas
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo, cliente, tipo o direccion"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as typeof status);
            }}
            value={status}
          >
            <option value="">Todos los estados</option>
            {INSTALLATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setTeamId(event.target.value);
            }}
            value={teamId}
          >
            <option value="">Todas las cuadrillas</option>
            {(teamsQuery.data ?? []).filter(Boolean).map((team) => (
              <option key={team!.id} value={team!.id}>
                {team!.name}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setProjectId(event.target.value);
            }}
            value={projectId}
          >
            <option value="">Todos los proyectos</option>
            {projectsQuery.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} | {project.title}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setClientId(event.target.value);
            }}
            value={clientId}
          >
            <option value="">Todos los clientes</option>
            {clientsQuery.data?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </select>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 xl:col-span-1">
            <input
              className={fieldClassName}
              onChange={(event) => {
                setPage(1);
                setDateFrom(event.target.value);
              }}
              type="date"
              value={dateFrom}
            />
            <input
              className={fieldClassName}
              onChange={(event) => {
                setPage(1);
                setDateTo(event.target.value);
              }}
              type="date"
              value={dateTo}
            />
          </div>
        </div>

        {ordersQuery.isPending ? (
          <LoadingState title="Cargando ordenes de instalacion" />
        ) : ordersQuery.isError ? (
          <ErrorState
            description={ordersQuery.error.message}
            title="No se pudieron cargar las ordenes"
          />
        ) : orders.length === 0 ? (
          <EmptyState
            description={INSTALLATION_LABELS.emptyStates.tableDescription}
            title={INSTALLATION_LABELS.emptyStates.tableTitle}
          />
        ) : (
          <>
            <div className={`${tableWrapperClassName} mt-5 overflow-x-auto`}>
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-stone-500">
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Cuadrilla</th>
                    <th className="px-4 py-3">Horario</th>
                    <th className="px-4 py-3">Preparacion</th>
                    <th className="px-4 py-3 text-right">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {orders.map((order) => {
                    const statusBadge = getInstallationStatusBadge(order.status);
                    const readinessState =
                      order.readiness.warnings.length === 0
                        ? "Lista para instalar"
                        : order.readiness.warnings.join(" | ");

                    return (
                      <tr key={order.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-stone-950">{order.code}</p>
                          <p className="mt-1 text-xs text-stone-500">{order.installationType}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-stone-900">{order.project?.title ?? "Sin proyecto"}</p>
                          <p className="mt-1 text-xs text-stone-500">{order.project?.code ?? "Sin codigo"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-stone-900">{order.client.displayName}</p>
                          <p className="mt-1 text-xs text-stone-500">{order.address.label}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-stone-900">
                            {order.assignedTeam?.name ?? "Sin cuadrilla"}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {order.assignedSupervisor?.name ?? "Sin supervisor"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-stone-700">
                          {formatInstallationScheduleWindow(
                            order.scheduledDate,
                            order.scheduledStartTime,
                            order.scheduledEndTime,
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-stone-700">{readinessState}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            Tareas {order.completedTaskCount}/{order.taskCount} | Evidencias {order.evidenceCount}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link className={secondaryButtonClassName} href={INSTALLATION_ROUTES.detail(order.id)}>
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                Pagina {pagination?.page ?? 1} de {pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1}
              </p>
              <div className="flex gap-3">
                <button
                  className={secondaryButtonClassName}
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                  }}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={
                    !pagination ||
                    page >= Math.ceil(pagination.total / pagination.perPage)
                  }
                  onClick={() => {
                    setPage((current) => current + 1);
                  }}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

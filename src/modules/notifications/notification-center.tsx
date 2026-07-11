"use client";

import { useDeferredValue, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Filter, Inbox, LoaderCircle, Search } from "lucide-react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/ui/stat-card";
import { QUERY_KEYS } from "@/lib/constants";
import { NotificationComposer } from "@/modules/notifications/notification-composer";
import { notificationTypeOptions } from "@/modules/notifications/forms";
import {
  NotificationDeleteButton,
  NotificationItem,
} from "@/modules/notifications/notification-item";
import { notificationService } from "@/services/notification-service";
import { getApiErrorMessage } from "@/utils";

const panelClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

export function NotificationCenter({
  canCreate,
}: {
  canCreate: boolean;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "error" | "info" | "success" | "warning">(
    "all",
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const notificationListQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page,
        perPage: pageSize,
        search: deferredSearch,
        type: typeFilter === "all" ? undefined : typeFilter,
        unreadOnly,
      }),
    queryKey: [
      ...QUERY_KEYS.notifications,
      "list",
      {
        page,
        pageSize,
        search: deferredSearch,
        typeFilter,
        unreadOnly,
      },
    ],
  });

  const totalQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
      }),
    queryKey: [...QUERY_KEYS.notifications, "total"],
    staleTime: 30_000,
  });

  const unreadQuery = useQuery({
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
        unreadOnly: true,
      }),
    queryKey: [...QUERY_KEYS.notifications, "unread"],
    staleTime: 15_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications,
      });
    },
  });

  const notifications = notificationListQuery.data?.data ?? [];
  const pagination = notificationListQuery.data?.pagination;
  const totalNotifications = totalQuery.data?.pagination.total ?? 0;
  const unreadNotifications = unreadQuery.data?.pagination.total ?? 0;
  const actionError =
    (markAllReadMutation.error && getApiErrorMessage(markAllReadMutation.error)) ||
    (markReadMutation.error && getApiErrorMessage(markReadMutation.error)) ||
    (deleteNotificationMutation.error &&
      getApiErrorMessage(deleteNotificationMutation.error)) ||
    null;

  if (notificationListQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(notificationListQuery.error)}
        title="No se pudieron cargar las notificaciones"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Las notificaciones nuevas se mantienen destacadas en la campana, el menú y la bandeja."
          icon={Bell}
          label="No leídas"
          tone="accent"
          value={String(unreadNotifications)}
        />
        <StatCard
          description="Esta bandeja conserva todo el historial de actividad dentro de la aplicación."
          icon={Inbox}
          label="Total"
          value={String(totalNotifications)}
        />
        <StatCard
          description="Usa las acciones compartidas para limpiar rápidamente la bandeja después de revisar la actividad reciente."
          icon={Filter}
          label="Acción masiva"
          value="Marcar todas como leídas"
        />
      </section>

      <div className={`grid gap-6 ${canCreate ? "xl:grid-cols-[1.25fr_0.9fr]" : ""}`}>
        <section className={panelClassName}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-stone-950">
                Bandeja de notificaciones
              </h2>
              <p className="text-sm leading-7 text-stone-700">
                Revisa los eventos recientes, abre los avisos no leídos y mantén ordenada tu bandeja.
              </p>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-md border border-stone-300/80 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={markAllReadMutation.isPending || unreadNotifications === 0}
              onClick={() => {
                void markAllReadMutation.mutateAsync();
              }}
              type="button"
            >
              {markAllReadMutation.isPending ? "Actualizando…" : "Marcar todas como leídas"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_11rem]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="h-12 w-full rounded-md border border-stone-300/80 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Buscar notificaciones"
                value={search}
              />
            </label>

            <select
              className="h-12 rounded-md border border-stone-300/80 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-blue-200"
              onChange={(event) => {
                setPage(1);
                setTypeFilter(
                  event.target.value as "all" | "error" | "info" | "success" | "warning",
                );
              }}
              value={typeFilter}
            >
              <option value="all">Todos los tipos</option>
              {notificationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className={`inline-flex h-12 items-center justify-center rounded-md border px-4 text-sm font-semibold transition ${
                unreadOnly
                  ? "border-[color:var(--color-primary-hover)] bg-[var(--color-primary)] text-[color:var(--color-primary-contrast)]"
                  : "border-stone-300/80 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-950"
              }`}
              onClick={() => {
                setPage(1);
                setUnreadOnly((current) => !current);
              }}
              type="button"
            >
              {unreadOnly ? "Solo no leídas" : "Todas las notificaciones"}
            </button>
          </div>

          {actionError ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </p>
          ) : null}

          {notificationListQuery.isLoading ? (
            <div className="mt-8 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white/70">
              <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando notificaciones…
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Los nuevos avisos aparecerán aquí automáticamente. También puede quitar filtros o crear un aviso manualmente."
                icon={Inbox}
                title="No hay notificaciones para esta vista"
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  actions={
                    <>
                      {!notification.isRead ? (
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-stone-300/80 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={markReadMutation.isPending}
                          onClick={() => {
                            void markReadMutation.mutateAsync(notification.id);
                          }}
                          type="button"
                        >
                          Marcar como leída
                        </button>
                      ) : null}
                      <NotificationDeleteButton
                        disabled={deleteNotificationMutation.isPending}
                        onClick={() => {
                          void deleteNotificationMutation.mutateAsync(notification.id);
                        }}
                      />
                    </>
                  }
                  notification={notification}
                />
              ))}
            </div>
          )}

          {pagination ? (
            <div className="mt-6">
              <DataTablePagination
                isLoading={notificationListQuery.isFetching}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
                onPageSizeChange={(nextPageSize) => {
                  setPage(1);
                  setPageSize(nextPageSize);
                }}
                page={pagination.page}
                pageSize={pagination.perPage}
                pageSizeOptions={[10, 20, 50]}
                total={pagination.total}
              />
            </div>
          ) : null}
        </section>

        {canCreate ? <NotificationComposer /> : null}
      </div>
    </div>
  );
}

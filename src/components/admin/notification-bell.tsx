"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import Link from "next/link";
import {
  Bell,
  CheckCheck,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { QUERY_KEYS } from "@/lib/constants";
import { NotificationTypeBadge } from "@/modules/notifications/notification-item";
import { notificationService } from "@/services/notification-service";
import { getApiErrorMessage } from "@/utils";
import { cn } from "@/utils";

export function NotificationBell({ canView }: { canView: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const recentNotificationsQuery = useQuery({
    enabled: canView,
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 5,
      }),
    queryKey: [...QUERY_KEYS.notifications, "recent"],
    staleTime: 15_000,
  });

  const unreadNotificationsQuery = useQuery({
    enabled: canView,
    queryFn: () =>
      notificationService.listNotifications({
        page: 1,
        perPage: 1,
        unreadOnly: true,
      }),
    queryKey: [...QUERY_KEYS.notifications, "unread"],
    staleTime: 10_000,
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

  const handleDocumentPointerDown = useEffectEvent((event: PointerEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      setOpen(false);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [open]);

  if (!canView) {
    return null;
  }

  const unreadCount = unreadNotificationsQuery.data?.pagination.total ?? 0;
  const notifications = recentNotificationsQuery.data?.data ?? [];
  const actionError =
    (markAllReadMutation.error && getApiErrorMessage(markAllReadMutation.error)) ||
    (markReadMutation.error && getApiErrorMessage(markReadMutation.error)) ||
    (deleteNotificationMutation.error &&
      getApiErrorMessage(deleteNotificationMutation.error)) ||
    null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold shadow-sm transition",
          open
            ? "border-[color:var(--color-primary)] bg-[var(--color-primary-soft)] text-[color:var(--color-text)]"
            : "border-[color:var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)]",
        )}
        onClick={() => {
          setOpen((current) => !current);
        }}
        type="button"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Notificaciones</span>
        {unreadNotificationsQuery.isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : unreadCount > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-sm bg-[var(--color-primary)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-primary-contrast)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            0
          </span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(30rem,92vw)] rounded-md border border-[color:var(--color-border)] bg-white p-4 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Bandeja
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--color-text)]">
                Notificaciones recientes
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)]">
                {unreadCount} sin leer
              </p>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              onClick={() => {
                void markAllReadMutation.mutateAsync();
              }}
              type="button"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo como leido
            </button>
          </div>

          {actionError ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </p>
          ) : null}

          {recentNotificationsQuery.isLoading ? (
            <div className="mt-5 flex min-h-44 items-center justify-center rounded-md border border-dashed border-[color:var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-3 text-sm font-medium text-[color:var(--color-text-muted)]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando notificaciones recientes...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                description="Los eventos automaticos y avisos manuales apareceran aqui."
                icon={Bell}
                title="No hay notificaciones"
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={cn(
                    "rounded-md border px-4 py-4",
                    notification.isRead
                      ? "border-[color:var(--color-border)] bg-[var(--color-surface)]"
                      : "border-[color:var(--color-border-strong)] bg-[var(--color-primary-soft)]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                        notification.isRead ? "bg-[var(--color-border-strong)]" : "bg-[var(--color-primary)]",
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <NotificationTypeBadge type={notification.type} />
                        {!notification.isRead ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                            Sin leer
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {notification.title}
                        </p>
                        <p className="text-sm leading-6 text-[color:var(--color-text-muted)]">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.isRead ? (
                          <button
                            className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)]"
                            disabled={markReadMutation.isPending}
                            onClick={() => {
                              void markReadMutation.mutateAsync(notification.id);
                            }}
                            type="button"
                          >
                            Marcar como leida
                          </button>
                        ) : null}
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)]"
                          disabled={deleteNotificationMutation.isPending}
                          onClick={() => {
                            void deleteNotificationMutation.mutateAsync(notification.id);
                          }}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5">
            <Link
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href="/notifications"
              onClick={() => {
                setOpen(false);
              }}
            >
              Abrir centro de notificaciones
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

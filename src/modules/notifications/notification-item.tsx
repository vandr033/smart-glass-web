"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import type { AppNotification, NotificationType } from "@/types";
import { cn } from "@/utils";

const notificationTypeConfig: Record<
  NotificationType,
  {
    badgeClassName: string;
    icon: typeof Bell;
    iconClassName: string;
    label: string;
  }
> = {
  error: {
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    icon: AlertCircle,
    iconClassName: "bg-rose-100 text-rose-700",
    label: "Error",
  },
  info: {
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    icon: Bell,
    iconClassName: "bg-sky-100 text-sky-700",
    label: "Info",
  },
  success: {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-100 text-emerald-700",
    label: "Exito",
  },
  warning: {
    badgeClassName: "border-blue-200 bg-blue-50 text-[color:var(--color-primary)]",
    icon: CircleAlert,
    iconClassName: "bg-blue-100 text-[color:var(--color-primary)]",
    label: "Aviso",
  },
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return notificationTypeConfig[type].label;
};

export const getNotificationTypeOptions = () => {
  return Object.entries(notificationTypeConfig).map(([value, config]) => ({
    label: config.label,
    value: value as NotificationType,
  }));
};

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  const config = notificationTypeConfig[type];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        config.badgeClassName,
      )}
    >
      {config.label}
    </span>
  );
}

export function NotificationItem({
  actions,
  notification,
}: {
  actions?: ReactNode;
  notification: AppNotification;
}) {
  const config = notificationTypeConfig[notification.type];
  const Icon = config.icon;

  return (
    <article
      className={cn(
        "rounded-md border px-5 py-5 shadow-sm transition",
        notification.isRead
          ? "border-stone-200/80 bg-white"
          : "border-blue-200/80 bg-[var(--color-primary-soft)]",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
            config.iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <NotificationTypeBadge type={notification.type} />
            {!notification.isRead ? (
              <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                Sin leer
              </span>
            ) : null}
            <time
              className="text-xs font-medium text-stone-500"
              dateTime={notification.createdAt}
              title={format(new Date(notification.createdAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </time>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-stone-950">{notification.title}</h3>
            <p className="text-sm leading-7 text-stone-700">{notification.message}</p>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function NotificationDeleteButton({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border border-stone-300/80 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Trash2 className="h-4 w-4" />
      Eliminar
    </button>
  );
}

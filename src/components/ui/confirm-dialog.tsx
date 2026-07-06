"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/utils";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  tone?: "danger" | "default";
};

export function ConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  description,
  isLoading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "danger",
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const closeDialog = useEffectEvent(() => {
    onOpenChange(false);
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        closeDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedElementRef.current?.focus();
    };
  }, [isLoading, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-[rgba(15,23,42,0.56)] p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Cerrar diálogo"
        className="absolute inset-0"
        disabled={isLoading}
        onClick={() => {
          if (!isLoading) {
            onOpenChange(false);
          }
        }}
        type="button"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "rounded-md p-3",
              tone === "danger"
                ? "bg-[var(--color-error)] text-[color:var(--color-primary-contrast)]"
                : "bg-[var(--color-primary)] text-[color:var(--color-primary-contrast)]",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <button
            aria-label="Cerrar diálogo"
            className="rounded-md p-2 text-[color:var(--color-text-muted)] transition hover:bg-[var(--color-surface)] hover:text-[color:var(--color-text)]"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false);
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <h2 className="font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.05em] text-[color:var(--color-text)]">
            {title}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--color-text-muted)]">
            {description}
          </p>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false);
            }}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition disabled:cursor-not-allowed disabled:opacity-60",
              tone === "danger"
                ? "bg-[var(--color-error)] hover:bg-rose-800"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
            )}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import Link from "next/link";
import { ChevronDown, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import type { AuthorizationSummary, AuthSession } from "@/types";
import { cn } from "@/utils";

type UserMenuProps = {
  authorization: AuthorizationSummary;
  session: AuthSession;
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export function UserMenu({ authorization, session }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const wasLogoutDialogOpenRef = useRef(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authSession,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authorization,
        }),
      ]);

      setLogoutDialogOpen(false);
      router.replace("/login");
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

  useEffect(() => {
    if (wasLogoutDialogOpenRef.current && !logoutDialogOpen) {
      buttonRef.current?.focus();
    }

    wasLogoutDialogOpenRef.current = logoutDialogOpen;
  }, [logoutDialogOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-3 rounded-md border px-3 py-2.5 text-left shadow-sm transition",
          open
            ? "border-[color:var(--color-primary)] bg-[var(--color-primary-soft)] text-[color:var(--color-text)]"
            : "border-[color:var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-border-strong)]",
        )}
        ref={buttonRef}
        onClick={() => {
          setOpen((current) => !current);
        }}
        type="button"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] text-sm font-semibold text-[color:var(--color-primary-soft-text)]">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={session.user.name}
              className="h-full w-full object-cover"
              src={session.user.image}
            />
          ) : (
            getInitials(session.user.name)
          )}
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold">{session.user.name}</p>
          <p className="truncate text-xs text-[color:var(--color-text-muted)]">
            {authorization.roles.join(", ") || "Sin rol asignado"}
          </p>
        </div>

        <ChevronDown className={cn("h-4 w-4 transition", open ? "rotate-180" : "rotate-0")} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[18rem] rounded-md border border-[color:var(--color-border)] bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[color:var(--color-text)]">{session.user.name}</p>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{session.user.email}</p>
            <div className="mt-4 flex items-start gap-3">
              <div className="rounded-md bg-[var(--color-primary-soft)] p-2 text-[color:var(--color-primary-soft-text)]">
                <Shield className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                  Acceso
                </p>
                <div className="flex flex-wrap gap-2">
                  {authorization.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-sm border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[color:var(--color-text)]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {authorization.permissions.length} permisos activos
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            <Link
              className="rounded-md border border-transparent bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[color:var(--color-text-muted)] transition hover:border-[color:var(--color-border)] hover:text-[color:var(--color-text)]"
              href="/profile"
              onClick={() => {
                setOpen(false);
              }}
            >
              Perfil
            </Link>
            <div className="rounded-md bg-[var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-text-muted)]">
              Sesión protegida y controlada por permisos.
            </div>
            <button
              className="inline-flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-[color:var(--color-text-muted)] transition hover:bg-[var(--color-primary-soft)] hover:text-[color:var(--color-primary-soft-text)]"
              disabled={logoutMutation.isPending}
              onClick={() => {
                setOpen(false);
                setLogoutDialogOpen(true);
              }}
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Cerrar sesión"
        description="Deberás iniciar sesión nuevamente para acceder a las áreas protegidas del sistema."
        isLoading={logoutMutation.isPending}
        onConfirm={() => {
          logoutMutation.mutate();
        }}
        onOpenChange={(nextOpen) => {
          if (!logoutMutation.isPending) {
            setLogoutDialogOpen(nextOpen);
          }
        }}
        open={logoutDialogOpen}
        title="¿Cerrar esta sesión?"
      />
    </div>
  );
}

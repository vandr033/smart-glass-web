"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useTransition,
} from "react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LifeBuoy,
  LogOut,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { buildBreadcrumbs } from "@/lib/navigation";
import { clientPortalService } from "@/services/client-portal-service";
import type { PortalSesion } from "@/types";
import { cn } from "@/utils";

type PortalShellProps = {
  children: ReactNode;
  session: PortalSesion;
};

type PortalSessionContextValue = {
  session: PortalSesion;
};

const PortalSessionContext = createContext<PortalSessionContextValue | null>(null);

const NAV_ITEMS = [
  {
    href: "/portal-cliente",
    icon: Home,
    label: "Inicio",
  },
  {
    href: "/portal-cliente/cotizaciones",
    icon: ReceiptText,
    label: "Cotizaciones",
  },
  {
    href: "/portal-cliente/proyectos",
    icon: FolderKanban,
    label: "Proyectos",
  },
  {
    href: "/portal-cliente/instalaciones",
    icon: CalendarDays,
    label: "Instalaciones",
  },
  {
    href: "/portal-cliente/garantias",
    icon: ShieldCheck,
    label: "Garantias",
  },
  {
    href: "/portal-cliente/postventa",
    icon: LifeBuoy,
    label: "Postventa",
  },
  {
    href: "/portal-cliente/documentos",
    icon: FileText,
    label: "Documentos",
  },
  {
    href: "/portal-cliente/mensajes",
    icon: MessageSquare,
    label: "Mensajes",
  },
] as const;

const portalDetailLabelMap: Record<string, string> = {
  "/portal-cliente/cotizaciones": "Detalle de cotizacion",
  "/portal-cliente/instalaciones": "Detalle de instalacion",
  "/portal-cliente/postventa": "Detalle postventa",
  "/portal-cliente/proyectos": "Detalle de proyecto",
};

const isRouteActive = (pathname: string, href: string): boolean => {
  return pathname === href || pathname.startsWith(`${href}/`);
};

const looksLikeEntityId = (value: string): boolean => {
  return /^[0-9a-f-]{8,}$/i.test(value);
};

export function usePortalSession(): PortalSesion {
  const context = useContext(PortalSessionContext);

  if (!context) {
    throw new Error("usePortalSession debe usarse dentro de PortalShell.");
  }

  return context.session;
}

export function PortalShell({ children, session }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const breadcrumbs = useMemo(
    () => {
      const rawBreadcrumbs = buildBreadcrumbs(pathname, {
        homeHref: "/portal-cliente",
        homeLabel: "Portal del Cliente",
      });

      return rawBreadcrumbs.map((item, index) => {
        const segment = item.href.split("/").filter(Boolean).at(-1) ?? "";
        const parentHref = rawBreadcrumbs[index - 1]?.href;

        if (!looksLikeEntityId(segment) || !parentHref) {
          return item;
        }

        return {
          ...item,
          label: portalDetailLabelMap[parentHref] ?? "Detalle",
        };
      });
    },
    [pathname],
  );

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await clientPortalService.logout();
      } finally {
        router.replace("/portal-cliente/iniciar-sesion");
      }
    });
  };

  return (
    <PortalSessionContext.Provider value={{ session }}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_24%),radial-gradient(circle_at_bottom_right,#f3d4a6,transparent_26%),linear-gradient(180deg,#f7fbff_0%,#f6f0e8_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8 lg:py-6">
          <aside className="w-full rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,#0f4ca8_0%,#0f5bd7_45%,#1e7a4d_180%)] p-5 text-white shadow-[0_30px_90px_rgba(15,76,168,0.18)] lg:sticky lg:top-6 lg:w-[18.5rem] lg:self-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">
                  Vidriera Sebitas ERP
                </p>
                <div>
                  <h1 className="font-[family:var(--font-display)] text-[1.8rem] font-semibold uppercase tracking-[0.04em]">
                    Portal del Cliente
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-blue-50/86">
                    Acceso externo seguro para acompanar tus proyectos y
                    documentos compartidos.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Cuenta activa
                </p>
                <p className="mt-3 text-lg font-semibold">{session.name}</p>
                <p className="mt-1 text-sm text-blue-50/85">{session.email}</p>
                <p className="mt-3 text-sm text-blue-50/85">
                  Cliente: {session.client.displayName}
                </p>
                <p className="mt-1 text-sm text-blue-50/85">
                  Proyectos habilitados: {session.projects.length}
                </p>
              </div>

              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-white text-[#0f4ca8]"
                          : "text-blue-50/92 hover:bg-white/10 hover:text-white",
                      )}
                      href={item.href}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? "Cerrando sesion..." : "Cerrar sesion"}
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-5 pb-6">
            <section className="rounded-[1.75rem] border border-[#ddd4c9] bg-white/88 px-5 py-4 shadow-[0_20px_60px_rgba(58,44,26,0.06)] backdrop-blur sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#6f6256]">
                <ClipboardList className="h-4 w-4 text-[#9a5b1b]" />
                {breadcrumbs.map((item, index) => (
                  <span className="inline-flex items-center gap-2" key={item.href}>
                    {index > 0 ? <span className="text-[#b4a38e]">/</span> : null}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-[#302016]">{item.label}</span>
                    ) : (
                      <Link className="transition hover:text-[#302016]" href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </span>
                ))}
              </div>
            </section>

            {children}
          </div>
        </div>
      </div>
    </PortalSessionContext.Provider>
  );
}

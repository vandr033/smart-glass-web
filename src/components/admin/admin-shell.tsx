"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Menu,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import * as IconSet from "lucide-react";

import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { NotificationBell } from "@/components/admin/notification-bell";
import { UserMenu } from "@/components/admin/user-menu";
import { formatModuleLabel } from "@/lib/formatters";
import { buildBreadcrumbs } from "@/lib/navigation";
import { buildSidebarSections } from "@/lib/admin-navigation";
import type { AuthorizationSummary, AuthSession, SidebarItem } from "@/types";
import { cn } from "@/utils";

type AdminShellProps = {
  authorization: AuthorizationSummary;
  brandDescription?: string;
  brandEyebrow?: string;
  brandName?: string;
  children: ReactNode;
  homeHref?: string;
  homeLabel?: string;
  navigationItems: SidebarItem[];
  session: AuthSession;
};

const matchesRoute = (pathname: string, route: string): boolean => {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
};

const getActiveRoute = (pathname: string, items: SidebarItem[]): string | null => {
  const matchingRoutes = items
    .map((item) => item.route)
    .filter((route) => matchesRoute(pathname, route))
    .sort((left, right) => right.length - left.length);

  return matchingRoutes[0] ?? null;
};

function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="Logotipo de Vidriera Sebitas ERP"
      className={className}
      src="/smart-glass-bolivia-logo.png"
    />
  );
}

type SidebarNavProps = {
  collapsed?: boolean;
  items: SidebarItem[];
  onNavigate?: () => void;
};

type SidebarNavItemProps = {
  active: boolean;
  collapsed?: boolean;
  item: SidebarItem;
  onNavigate?: () => void;
};

function SidebarNavItem({
  active,
  collapsed = false,
  item,
  onNavigate,
}: SidebarNavItemProps) {
  const iconRegistry = IconSet as unknown as Record<string, LucideIcon>;
  const Icon = iconRegistry[item.icon] ?? IconSet.LayoutDashboard;

  return (
    <Link
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex min-h-10 items-center overflow-hidden rounded-md border border-transparent transition",
        collapsed ? "justify-center px-2.5 py-2.5" : "gap-3 px-3.5 py-2.5",
        active
          ? "border-white/10 bg-[rgba(15,91,215,0.18)] text-[color:var(--color-sidebar-text)]"
          : "text-[color:var(--color-sidebar-muted)] hover:border-white/8 hover:bg-white/4 hover:text-[color:var(--color-sidebar-text)]",
      )}
      href={item.route}
      onClick={onNavigate}
      title={collapsed ? formatModuleLabel(item.label) : undefined}
    >
      <span
        className={cn(
          "absolute bottom-2 left-0 top-2 w-px rounded-full bg-[var(--color-accent)] transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
          active
            ? "border-white/10 bg-[var(--color-primary)] text-[color:var(--color-primary-contrast)]"
            : "border-transparent bg-white/5 text-[color:var(--color-sidebar-muted)] group-hover:bg-white/10 group-hover:text-[color:var(--color-sidebar-text)]",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      {!collapsed ? (
        <span className="min-w-0 truncate text-sm font-medium">
          {formatModuleLabel(item.label)}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNav({ collapsed = false, items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const activeRoute = useMemo(() => getActiveRoute(pathname, items), [items, pathname]);
  const sections = useMemo(() => buildSidebarSections(items), [items]);

  if (collapsed) {
    return (
      <nav className="grid gap-2" aria-label="Navegacion principal">
        {items.map((item) => (
          <SidebarNavItem
            key={item.route}
            active={item.route === activeRoute}
            collapsed
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav className="grid gap-5" aria-label="Navegacion principal">
      {sections.map((section) => (
        <section key={section.label} className="space-y-1.5">
          <p className="px-3.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-sidebar-muted)]">
            {section.label}
          </p>
          <div className="grid gap-1">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.route}
                active={item.route === activeRoute}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

function TopbarSearch({
  className,
  value,
  onChange,
}: {
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label
      className={cn(
        "flex min-w-[16rem] items-center gap-3 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[color:var(--color-text)] shadow-sm",
        className,
      )}
    >
      <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
      <input
        className="w-full border-none bg-transparent outline-none placeholder:text-[color:var(--color-text-subtle)]"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="Buscar modulos, clientes o materiales"
        type="search"
        value={value}
      />
    </label>
  );
}

export function AdminShell({
  authorization,
  brandDescription = "Soluciones en vidrio inteligente para Bolivia.",
  brandEyebrow = "VIDRIERA SEBITAS",
  brandName = "ERP",
  children,
  homeHref = "/admin",
  homeLabel = "Centro ERP",
  navigationItems,
  session,
}: AdminShellProps) {
  const pathname = usePathname();
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(pathname, { homeHref, homeLabel }),
    [homeHref, homeLabel, pathname],
  );
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState("");
  const firstName = session.user.name.split(" ").filter(Boolean)[0] ?? session.user.name;
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? homeLabel;
  const currentContext =
    breadcrumbs.length > 2 ? breadcrumbs[breadcrumbs.length - 2]?.label : homeLabel;

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <Link
          className={cn(
            "flex items-start gap-3 rounded-md border border-white/8 bg-white/[0.03] px-3.5 py-3.5 transition hover:bg-white/[0.05]",
            desktopCollapsed && "justify-center px-2.5",
          )}
          href={homeHref}
          onClick={() => {
            setMobileOpen(false);
          }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/12 bg-white">
            <BrandLogo className="h-full w-full object-contain" />
          </div>
          {!desktopCollapsed ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-[family:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--color-sidebar-muted)]">
                  {brandEyebrow}
                </p>
                <span className="inline-flex items-center rounded-sm bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d2b04]">
                  ERP
                </span>
              </div>
              <h1 className="mt-1 font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-sidebar-text)]">
                {brandName}
              </h1>
              <p className="mt-2 max-w-[24ch] text-xs leading-5 text-[color:var(--color-sidebar-muted)]">
                {brandDescription}
              </p>
            </div>
          ) : null}
        </Link>
      </div>

      <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
        <SidebarNav
          collapsed={desktopCollapsed}
          items={navigationItems}
          onNavigate={() => {
            setMobileOpen(false);
          }}
        />
      </div>

      <div className="mt-6 shrink-0 border-t border-white/8 pt-4">
        {!desktopCollapsed ? (
          <div className="mb-3 rounded-md border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-sidebar-muted)]">
              Sesion activa
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--color-sidebar-text)]">
              {session.user.name}
            </p>
            <p className="text-xs text-[color:var(--color-sidebar-muted)]">
              {authorization.roles[0] ?? "Sin rol asignado"}
            </p>
          </div>
        ) : null}

        <button
          aria-label={desktopCollapsed ? "Expandir menu" : "Contraer menu"}
          className={cn(
            "hidden w-full items-center gap-3 rounded-md border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-[color:var(--color-sidebar-text)] transition hover:bg-white/[0.06] lg:inline-flex",
            desktopCollapsed && "justify-center px-2.5",
          )}
          onClick={() => {
            setDesktopCollapsed((current) => !current);
          }}
          type="button"
        >
          {desktopCollapsed ? (
            <ChevronRight className="h-4.5 w-4.5" />
          ) : (
            <ChevronLeft className="h-4.5 w-4.5" />
          )}
          {!desktopCollapsed ? "Contraer menu" : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-[var(--background)] text-[color:var(--color-text)]">
      <div className="flex h-screen w-full overflow-hidden">
        <aside
          className={cn(
            "hidden h-screen border-r border-[color:var(--color-sidebar-border)] bg-[linear-gradient(180deg,var(--color-sidebar-start)_0%,var(--color-sidebar-mid)_42%,var(--color-sidebar-end)_100%)] px-4 py-5 lg:block",
            desktopCollapsed ? "w-[5.75rem]" : "w-[16.25rem]",
          )}
        >
          {sidebarContent}
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Cerrar menu"
              className="absolute inset-0 bg-[rgba(7,24,39,0.64)]"
              onClick={() => {
                setMobileOpen(false);
              }}
              type="button"
            />
            <aside className="relative z-10 h-full w-[min(16.25rem,88vw)] bg-[linear-gradient(180deg,var(--color-sidebar-start)_0%,var(--color-sidebar-mid)_42%,var(--color-sidebar-end)_100%)] px-4 py-5 shadow-[24px_0_48px_rgba(7,24,39,0.32)]">
              <div className="mb-4 flex justify-end">
                <button
                  className="inline-flex rounded-md border border-white/8 bg-white/[0.05] p-2.5 text-[color:var(--color-sidebar-text)]"
                  onClick={() => {
                    setMobileOpen(false);
                  }}
                  type="button"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="h-[calc(100%-3rem)]">{sidebarContent}</div>
            </aside>
          </div>
        ) : null}

        <div className="h-screen min-w-0 flex-1 overflow-y-auto bg-[var(--background)]">
          <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[rgba(245,247,250,0.92)] backdrop-blur-sm">
            <div className="px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      aria-label="Abrir menu"
                      className="inline-flex rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-3 text-[color:var(--color-primary)] shadow-sm lg:hidden"
                      onClick={() => {
                        setMobileOpen(true);
                      }}
                      type="button"
                    >
                      <Menu className="h-4.5 w-4.5" />
                    </button>

                    <button
                      aria-label={desktopCollapsed ? "Expandir menu" : "Contraer menu"}
                      className="hidden rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-3 text-[color:var(--color-primary)] shadow-sm lg:inline-flex"
                      onClick={() => {
                        setDesktopCollapsed((current) => !current);
                      }}
                      type="button"
                    >
                      {desktopCollapsed ? (
                        <ChevronRight className="h-4.5 w-4.5" />
                      ) : (
                        <ChevronLeft className="h-4.5 w-4.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <h1 className="truncate font-[family:var(--font-display)] text-[1.65rem] font-semibold uppercase tracking-[0.06em] text-[color:var(--color-text)]">
                        {currentPage}
                      </h1>
                      <p className="truncate text-sm text-[color:var(--color-text-muted)]">
                        {currentContext !== currentPage ? `${currentContext} · ` : ""}
                        Bienvenido, {firstName}
                      </p>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 xl:flex">
                    <Link
                      className="inline-flex items-center gap-3 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-left shadow-sm"
                      href="/admin/inventory/warehouses"
                      title="Administrar almacenes"
                    >
                      <Building2 className="h-4 w-4 text-[color:var(--color-primary)]" />
                      <span className="text-sm">
                        <span className="mr-1 text-[color:var(--color-text-muted)]">Sucursal:</span>
                        <span className="font-semibold text-[color:var(--color-text)]">Santa Cruz</span>
                      </span>
                    </Link>
                    <TopbarSearch
                      className="w-[20rem]"
                      onChange={setTopbarSearch}
                      value={topbarSearch}
                    />
                    <button
                      aria-label="Ayuda"
                      className="inline-flex rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-3 text-[color:var(--color-primary)] shadow-sm"
                      type="button"
                    >
                      <HelpCircle className="h-4.5 w-4.5" />
                    </button>
                    <NotificationBell canView={authorization.permissions.includes("notifications.view")} />
                    <UserMenu authorization={authorization} session={session} />
                  </div>

                  <div className="flex items-center gap-2 xl:hidden">
                    <NotificationBell canView={authorization.permissions.includes("notifications.view")} />
                    <UserMenu authorization={authorization} session={session} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:hidden">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm shadow-sm"
                      href="/admin/inventory/warehouses"
                      title="Administrar almacenes"
                    >
                      <Building2 className="h-4 w-4 text-[color:var(--color-primary)]" />
                      <span>
                        <span className="mr-1 text-[color:var(--color-text-muted)]">Sucursal:</span>
                        <span className="font-semibold text-[color:var(--color-text)]">Santa Cruz</span>
                      </span>
                    </Link>
                    <button
                      aria-label="Ayuda"
                      className="inline-flex rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] p-2.5 text-[color:var(--color-primary)] shadow-sm"
                      type="button"
                    >
                      <HelpCircle className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <TopbarSearch onChange={setTopbarSearch} value={topbarSearch} />
                </div>

                <Breadcrumbs homeHref={homeHref} homeLabel={homeLabel} />
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

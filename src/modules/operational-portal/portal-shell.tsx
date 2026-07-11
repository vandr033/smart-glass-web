"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Boxes,
  ClipboardCheck,
  Factory,
  Home,
  MapPin,
  Menu,
  ScanLine,
  Settings2,
  ShieldAlert,
  Truck,
  X,
} from "lucide-react";

import { authService } from "@/services/auth-service";
import { cn } from "@/utils";

import { PORTAL_AREAS, PORTAL_ROUTES } from "./constants";

type Props = {
  children: ReactNode;
  permissions: string[];
  user: { avatar: string | null; email: string; name: string };
};

type NavItem = { href: string; label: string; icon: typeof Home; area?: keyof typeof PORTAL_AREAS };

const navItems: NavItem[] = [
  { href: PORTAL_ROUTES.inicio, icon: Home, label: "Inicio" },
  { href: PORTAL_ROUTES.tareas, icon: ClipboardCheck, label: "Mis tareas" },
  { href: PORTAL_ROUTES.escanear, icon: ScanLine, label: "Escanear" },
  { href: PORTAL_ROUTES.almacen, icon: Boxes, label: "Almacén", area: "almacen" },
  { href: PORTAL_ROUTES.produccion, icon: Factory, label: "Producción", area: "produccion" },
  { href: PORTAL_ROUTES.mediciones, icon: MapPin, label: "Mediciones", area: "mediciones" },
  { href: PORTAL_ROUTES.instalaciones, icon: Truck, label: "Instalaciones", area: "instalaciones" },
  { href: PORTAL_ROUTES.incidencias, icon: ShieldAlert, label: "Incidencias", area: "incidencias" },
  { href: PORTAL_ROUTES.calidad, icon: ClipboardCheck, label: "Control de calidad", area: "calidad" },
  { href: PORTAL_ROUTES.supervision, icon: Settings2, label: "Supervisión", area: "supervision" },
];

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function OperationalPortalShell({ children, permissions, user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const canSee = (area?: keyof typeof PORTAL_AREAS) => !area || PORTAL_AREAS[area].some((permission) => permissions.includes(permission));
  const visibleItems = navItems.filter((item) => canSee(item.area));
  const activeItem = visibleItems.find((item) => matches(pathname, item.href));

  const logout = async () => {
    await authService.logout();
    router.push("/operaciones/iniciar-sesion");
    router.refresh();
  };

  return (
    <div className="portal-frame">
      <aside className={cn("portal-sidebar", menuOpen && "portal-sidebar--open")}>
        <div className="portal-brand">
          <div className="portal-brand-mark"><span>VS</span></div>
          <div>
            <p className="portal-kicker">VIDRIERA SEBITAS</p>
            <p className="portal-brand-name">Portal Operativo</p>
          </div>
          <button className="portal-icon-button portal-sidebar-close" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} type="button"><X size={19} /></button>
        </div>
        <div className="portal-online"><span className="portal-online-dot" /> Conectado al ERP</div>
        <nav className="portal-nav" aria-label="Navegación operativa">
          <p className="portal-nav-label">Espacio de trabajo</p>
          {visibleItems.slice(0, 3).map((item) => <NavLink key={item.href} item={item} active={matches(pathname, item.href)} onNavigate={() => setMenuOpen(false)} />)}
          <p className="portal-nav-label portal-nav-label--spaced">Áreas operativas</p>
          {visibleItems.slice(3).map((item) => <NavLink key={item.href} item={item} active={matches(pathname, item.href)} onNavigate={() => setMenuOpen(false)} />)}
        </nav>
        <div className="portal-sidebar-foot">
          <Link className="portal-user-card" href={PORTAL_ROUTES.perfil} onClick={() => setMenuOpen(false)}>
            <div className="portal-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs text-[color:var(--portal-muted)]">{user.email}</p></div>
          </Link>
          <button className="portal-logout" onClick={logout} type="button">Cerrar sesión</button>
        </div>
      </aside>

      {menuOpen ? <button className="portal-scrim" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)} type="button" /> : null}

      <div className="portal-content">
        <header className="portal-topbar">
          <div className="flex items-center gap-3">
            <button className="portal-icon-button portal-menu-trigger" aria-label="Abrir menú" onClick={() => setMenuOpen(true)} type="button"><Menu size={21} /></button>
            <div><p className="portal-topbar-eyebrow">{activeItem?.label ?? "Portal Operativo"}</p><p className="portal-topbar-context">Trabajo en campo · {new Intl.DateTimeFormat("es-BO", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="portal-connection"><span className="portal-online-dot" /> <span className="hidden sm:inline">Conectado</span></span>
            <Link className="portal-notification-button" href={PORTAL_ROUTES.notificaciones} aria-label="Notificaciones"><Bell size={19} /><span className="portal-notification-badge">!</span></Link>
            <Link className="portal-top-user" href={PORTAL_ROUTES.perfil}><span className="portal-avatar portal-avatar--small">{user.name.slice(0, 1).toUpperCase()}</span><span className="hidden text-sm font-semibold md:inline">{user.name.split(" ")[0]}</span></Link>
          </div>
        </header>
        <main className="portal-main">{children}</main>
        <nav className="portal-bottom-nav" aria-label="Navegación rápida">
          {visibleItems.slice(0, 5).map((item) => <NavLink key={item.href} item={item} active={matches(pathname, item.href)} compact />)}
        </nav>
      </div>
    </div>
  );
}

function NavLink({ item, active, compact = false, onNavigate }: { item: NavItem; active: boolean; compact?: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return <Link className={cn("portal-nav-link", active && "portal-nav-link--active", compact && "portal-nav-link--compact")} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
    <Icon size={compact ? 19 : 18} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>
  </Link>;
}

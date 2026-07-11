import { formatEnumLabel, formatModuleLabel } from "@/lib/formatters";
import { generatedSidebarItems } from "@/modules/generated-module-registry";
import type { SidebarItem } from "@/types";

type SidebarConfigItem = Omit<SidebarItem, "icon"> & {
  icon: string;
};

const CORE_SIDEBAR_ITEMS: SidebarConfigItem[] = [
  { icon: "LayoutDashboard", label: "Panel principal", route: "/" },
  { icon: "Users", label: "Usuarios", permission: "system.users.read", route: "/users" },
  { icon: "ShieldCheck", label: "Roles y permisos", permission: "system.roles.read", route: "/roles" },
  { icon: "MailPlus", label: "Invitaciones", permission: "invitations.view", route: "/invitations" },
  { icon: "Bell", label: "Notificaciones", permission: "notifications.view", route: "/notifications" },
  { icon: "ClipboardList", label: "Actividad", permission: "activity_logs.view", route: "/activity-logs" },
  { icon: "FileSearch", label: "Auditoria", permission: "system.audit.read", route: "/audit-logs" },
  { icon: "Settings", label: "Configuracion", permission: "system.settings.read", route: "/settings" },
];

export const SIDEBAR_ITEMS: SidebarConfigItem[] = [
  ...CORE_SIDEBAR_ITEMS,
  ...generatedSidebarItems,
];

const routeLabelMap = new Map(
  SIDEBAR_ITEMS.map((item) => [item.route, item.label] as const),
);

routeLabelMap.set("/forbidden", "Sin acceso");
routeLabelMap.set("/admin", "Centro ERP");
routeLabelMap.set("/admin/audit-log", "Auditoria");
routeLabelMap.set("/admin/clients", "Clientes");
routeLabelMap.set("/admin/cutting", "Corte");
routeLabelMap.set("/admin/inventory", "Inventario");
routeLabelMap.set("/admin/inventory/warehouses", "Almacenes");
routeLabelMap.set("/admin/installation", "Instalaciones");
routeLabelMap.set("/admin/material-categories", "Categorias de materiales");
routeLabelMap.set("/admin/materials", "Materiales");
routeLabelMap.set("/admin/postventa", "Postventa");
routeLabelMap.set("/admin/postventa/new", "Registrar caso");
routeLabelMap.set("/admin/portal-clientes", "Portal del Cliente");
routeLabelMap.set("/admin/price-lists", "Listas de precios");
routeLabelMap.set("/admin/product-templates", "Plantillas de producto");
routeLabelMap.set("/admin/projects", "Proyectos");
routeLabelMap.set("/admin/quotations", "Cotizaciones");
routeLabelMap.set("/admin/rentabilidad", "Rentabilidad");
routeLabelMap.set("/admin/remnants", "Remanentes");
routeLabelMap.set("/admin/reports", "Tableros ejecutivos");
routeLabelMap.set("/admin/roles", "Roles y permisos");
routeLabelMap.set("/admin/settings", "Configuracion");
routeLabelMap.set("/admin/settings/supplier-categories", "Categorias de proveedores");
routeLabelMap.set("/admin/settings/supplier-scoring", "Puntajes de proveedor");
routeLabelMap.set("/admin/supplier-material-equivalences", "Equivalencias de proveedor");
routeLabelMap.set("/admin/suppliers", "Proveedores");
routeLabelMap.set("/admin/tableros", "Tableros ejecutivos");
routeLabelMap.set("/audit-logs", "Auditoria");
routeLabelMap.set("/cutting", "Corte");
routeLabelMap.set("/cutting/optimizations", "Optimizaciones");
routeLabelMap.set("/cutting/plans", "Planes de corte");
routeLabelMap.set("/operations", "Operaciones");
routeLabelMap.set("/operations/profile-optimization", "Optimizacion de perfiles");
routeLabelMap.set("/operations/profile-cutting-plans", "Planes de corte de perfiles");
routeLabelMap.set("/purchasing", "Compras");
routeLabelMap.set("/purchasing/comparisons", "Comparativos");
routeLabelMap.set("/purchasing/orders", "Ordenes de compra");
routeLabelMap.set("/purchasing/receipts", "Recepciones");
routeLabelMap.set("/purchasing/requests", "Solicitudes de compra");
routeLabelMap.set("/production", "Produccion");
routeLabelMap.set("/production/jobs", "Ordenes de trabajo");
routeLabelMap.set("/products", "Productos");
routeLabelMap.set("/profile", "Perfil");
routeLabelMap.set("/portal-cliente", "Portal del Cliente");
routeLabelMap.set("/portal-cliente/cotizaciones", "Cotizaciones");
routeLabelMap.set("/portal-cliente/documentos", "Documentos");
routeLabelMap.set("/portal-cliente/garantias", "Garantias");
routeLabelMap.set("/portal-cliente/iniciar-sesion", "Iniciar sesion");
routeLabelMap.set("/portal-cliente/instalaciones", "Instalaciones");
routeLabelMap.set("/portal-cliente/invitacion", "Activar acceso");
routeLabelMap.set("/portal-cliente/mensajes", "Mensajes");
routeLabelMap.set("/portal-cliente/olvide-clave", "Restablecer acceso");
routeLabelMap.set("/portal-cliente/postventa", "Postventa");
routeLabelMap.set("/portal-cliente/proyectos", "Proyectos");
routeLabelMap.set("/portal-cliente/restablecer-clave", "Nueva contrasena");

export type BreadcrumbItem = {
  href: string;
  label: string;
};

type BreadcrumbOptions = {
  homeHref?: string;
  homeLabel?: string;
};

export const getRouteLabel = (route: string): string => {
  const routeSegments = route.split("/").filter(Boolean);
  const lastSegment = routeSegments[routeSegments.length - 1] ?? route;

  return routeLabelMap.get(route) ?? formatModuleLabel(formatEnumLabel(lastSegment));
};

export const buildBreadcrumbs = (
  pathname: string,
  options: BreadcrumbOptions = {},
): BreadcrumbItem[] => {
  const homeHref = options.homeHref ?? "/";
  const homeLabel = options.homeLabel ?? "Panel principal";

  if (pathname === homeHref) {
    return [
      {
        href: homeHref,
        label: homeLabel,
      },
    ];
  }

  const isInsideHome =
    homeHref !== "/" && pathname.startsWith(`${homeHref}/`);
  const relativePath =
    isInsideHome
      ? pathname.slice(homeHref.length)
      : pathname;
  const segments = relativePath.split("/").filter(Boolean);

  return [
    {
      href: homeHref,
      label: homeLabel,
    },
    ...segments.map((segment, index) => {
      const href =
        homeHref === "/" || !isInsideHome
          ? `/${segments.slice(0, index + 1).join("/")}`
          : `${homeHref}/${segments.slice(0, index + 1).join("/")}`;

      return {
        href,
        label: routeLabelMap.get(href) ?? formatModuleLabel(formatEnumLabel(segment)),
      };
    }),
  ];
};

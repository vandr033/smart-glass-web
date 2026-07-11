import { formatModuleLabel } from "@/lib/formatters";
import type {
  AuthorizationSummary,
  CurrentUserPayload,
  EnabledModule,
  SidebarItem,
} from "@/types";

export type SidebarSection = {
  items: SidebarItem[];
  label: string;
};

const TABLEROS_ROUTE = "/admin/tableros";
const REPORTS_LEGACY_ROUTE = "/admin/reports";
const TABLEROS_LABEL = "Tableros ejecutivos";

const normalizeEnabledModule = (moduleItem: EnabledModule): EnabledModule => {
  const normalizedLabel = moduleItem.label.trim().toLowerCase();
  const isLegacyReportsModule =
    moduleItem.key === "reports" ||
    moduleItem.route === REPORTS_LEGACY_ROUTE ||
    normalizedLabel === "reports" ||
    normalizedLabel === "reportes";

  if (!isLegacyReportsModule) {
    return moduleItem;
  }

  return {
    ...moduleItem,
    description:
      moduleItem.description ||
      "Vista consolidada comercial, operativa, financiera y de postventa para gerencia.",
    key: "tableros",
    label: TABLEROS_LABEL,
    route: TABLEROS_ROUTE,
  };
};

export const buildAuthorizationSummary = (
  currentUser: CurrentUserPayload,
): AuthorizationSummary => ({
  isAdmin: currentUser.isAdmin,
  isSuperAdmin: currentUser.isSuperAdmin,
  permissions: currentUser.permissions,
  roles: currentUser.roles,
  userId: currentUser.user.id,
});

export const buildAdminNavigationItems = (
  currentUser: CurrentUserPayload,
): SidebarItem[] => {
  const normalizedModules = Array.from(
    new Map(
      currentUser.enabledModules
        .map(normalizeEnabledModule)
        .map((moduleItem) => [moduleItem.route, moduleItem] as const),
    ).values(),
  );
  const fallbackTablerosPermission =
    currentUser.permissions.includes("tableros.ver")
      ? "tableros.ver"
      : currentUser.permissions.includes("reportes.ver")
        ? "reportes.ver"
        : "reports.read";
  const productionAdvancedItems = currentUser.permissions.includes("production.read")
    ? [
        { icon: "LayoutDashboard", label: "Tablero de producción", permission: "production.read", route: "/production/tablero" },
        { icon: "CalendarClock", label: "Planificación", permission: "production.read", route: "/production/planificacion" },
        { icon: "ClipboardList", label: "Órdenes de trabajo", permission: "production.read", route: "/production/ordenes" },
        { icon: "Gauge", label: "Carga de trabajo", permission: "production.read", route: "/production/carga-trabajo" },
        { icon: "Factory", label: "Centros de trabajo", permission: "production.read", route: "/production/centros-trabajo" },
        { icon: "ShieldCheck", label: "Control de calidad", permission: "production.read", route: "/production/calidad" },
        { icon: "LockKeyhole", label: "Bloqueos", permission: "production.read", route: "/production/bloqueos" },
        { icon: "Recycle", label: "Desperdicios", permission: "production.read", route: "/production/desperdicios" },
      ]
    : [];
  const items: SidebarItem[] = [
    ...normalizedModules.map((moduleItem) => ({
      icon: moduleItem.icon ?? "LayoutDashboard",
      label: formatModuleLabel(moduleItem.label),
      permission: moduleItem.requiredPermission ?? undefined,
      route: moduleItem.route,
    })),
    ...productionAdvancedItems.filter((advancedItem) => !normalizedModules.some((moduleItem) => moduleItem.route === advancedItem.route)),
    ...((currentUser.permissions.includes("tableros.ver") ||
      currentUser.permissions.includes("reportes.ver") ||
      currentUser.permissions.includes("reports.read")) &&
    !normalizedModules.some((moduleItem) => moduleItem.route === TABLEROS_ROUTE)
      ? [
          {
            icon: "Gauge",
            label: TABLEROS_LABEL,
            permission: fallbackTablerosPermission,
            route: TABLEROS_ROUTE,
          },
        ]
      : []),
    ...(currentUser.permissions.includes("mediciones.ver") &&
    !normalizedModules.some((moduleItem) => moduleItem.route === "/admin/mediciones")
      ? [
          {
            icon: "Ruler",
            label: "Mediciones",
            permission: "mediciones.ver",
            route: "/admin/mediciones",
          },
        ]
      : []),
    ...(currentUser.permissions.includes("postventa.ver") &&
    !normalizedModules.some((moduleItem) => moduleItem.route === "/admin/postventa")
      ? [
          {
            icon: "ShieldCheck",
            label: "Postventa",
            permission: "postventa.ver",
            route: "/admin/postventa",
          },
        ]
      : []),
    ...(currentUser.permissions.includes("portal_cliente.ver") &&
    !normalizedModules.some((moduleItem) => moduleItem.route === "/admin/portal-clientes")
      ? [
          {
            icon: "MonitorSmartphone",
            label: "Portal del Cliente",
            permission: "portal_cliente.ver",
            route: "/admin/portal-clientes",
          },
        ]
      : []),
    ...(currentUser.permissions.includes("system.users.read")
      ? [
          {
            icon: "Users",
            label: "Usuarios",
            permission: "system.users.read",
            route: "/users",
          },
        ]
      : []),
    ...(currentUser.permissions.includes("system.roles.read")
      ? [
          {
            icon: "ShieldCheck",
            label: "Roles y permisos",
            permission: "system.roles.read",
            route: "/admin/roles",
          },
        ]
      : []),
  ];

  return items;
};

export const buildSidebarSections = (items: SidebarItem[]): SidebarSection[] => {
  const pickItems = (routes: string[]) =>
    routes
      .map((route) => items.find((item) => item.route === route))
      .filter((item): item is SidebarItem => Boolean(item));

  const usedRoutes = new Set<string>();
  const makeSection = (label: string, routes: string[]): SidebarSection | null => {
    const sectionItems = pickItems(routes);

    sectionItems.forEach((item) => {
      usedRoutes.add(item.route);
    });

    return sectionItems.length > 0
      ? {
          items: sectionItems,
          label,
        }
      : null;
  };

  const sections = [
    makeSection("Panel principal", ["/admin", TABLEROS_ROUTE]),
    makeSection("Comercial", [
      "/admin/mediciones",
      "/admin/quotations",
      "/admin/clients",
      "/admin/projects",
      "/admin/portal-clientes",
      "/admin/rentabilidad",
      "/admin/product-templates",
    ]),
    makeSection("Compras", [
      "/purchasing",
      "/purchasing/requests",
      "/purchasing/comparisons",
      "/purchasing/orders",
      "/purchasing/receipts",
      "/admin/price-lists",
    ]),
    makeSection("Operaciones", [
      "/admin/inventory",
      "/admin/remnants",
      "/admin/production",
      "/admin/installation",
      "/admin/postventa",
      "/operations/profile-optimization",
      "/operations/profile-cutting-plans",
      "/production",
      "/production/tablero",
      "/production/planificacion",
      "/production/jobs",
      "/production/ordenes",
      "/production/carga-trabajo",
      "/production/centros-trabajo",
      "/production/calidad",
      "/production/bloqueos",
      "/production/desperdicios",
      "/cutting",
      "/cutting/plans",
      "/cutting/optimizations",
      "/products",
    ]),
    makeSection("Configuracion", [
      "/admin/materials",
      "/admin/material-categories",
      "/admin/supplier-material-equivalences",
      "/admin/suppliers",
      "/users",
      "/admin/roles",
      "/admin/settings",
      "/notifications",
      "/activity-logs",
      "/audit-logs",
      "/admin/audit-log",
    ]),
  ].filter((section): section is SidebarSection => Boolean(section));

  const remainingItems = items.filter((item) => !usedRoutes.has(item.route));

  if (remainingItems.length > 0) {
    sections.push({
      items: remainingItems,
      label: "Otros",
    });
  }

  return sections;
};

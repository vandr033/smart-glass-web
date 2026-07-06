import { formatModuleLabel } from "@/lib/formatters";
import type { AuthorizationSummary, CurrentUserPayload, SidebarItem } from "@/types";

export type SidebarSection = {
  items: SidebarItem[];
  label: string;
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
  const items: SidebarItem[] = [
    ...currentUser.enabledModules.map((moduleItem) => ({
      icon: moduleItem.icon ?? "LayoutDashboard",
      label: formatModuleLabel(moduleItem.label),
      permission: moduleItem.requiredPermission ?? undefined,
      route: moduleItem.route,
    })),
    ...(currentUser.permissions.includes("mediciones.ver") &&
    !currentUser.enabledModules.some((moduleItem) => moduleItem.route === "/admin/mediciones")
      ? [
          {
            icon: "Ruler",
            label: "Mediciones",
            permission: "mediciones.ver",
            route: "/admin/mediciones",
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
    makeSection("Panel principal", ["/admin"]),
    makeSection("Comercial", [
      "/admin/mediciones",
      "/admin/quotations",
      "/admin/clients",
      "/admin/projects",
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
      "/operations/profile-optimization",
      "/operations/profile-cutting-plans",
      "/production",
      "/production/jobs",
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

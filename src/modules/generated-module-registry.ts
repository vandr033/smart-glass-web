export const generatedPermissionResources = [
  {
    key: "installations",
    label: "Instalaciones",
  },
  {
    key: "postventa",
    label: "Postventa",
  },
  {
    key: "products",
    label: "Productos",
  },
  {
    key: "production",
    label: "Produccion",
  },
] as const;

export const generatedSidebarItems = [
  {
    icon: "Wrench",
    label: "Instalaciones",
    permission: "installations.view",
    route: "/admin/installation",
  },
  {
    icon: "ShieldCheck",
    label: "Postventa",
    permission: "postventa.ver",
    route: "/admin/postventa",
  },
  {
    icon: "Package",
    label: "Productos",
    permission: "products.view",
    route: "/products",
  },
  {
    icon: "Hammer",
    label: "Produccion",
    permission: "production.read",
    route: "/production",
  },
];

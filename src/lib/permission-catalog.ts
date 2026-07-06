import { formatModuleLabel, formatPermissionDescription, formatPermissionLabel } from "@/lib/formatters";
import type { PermissionCatalogGroup } from "@/types";

const PERMISSION_GROUP_DEFINITIONS = {
  clients: [
    "clients.read",
    "clients.create",
    "clients.update",
    "clients.delete",
  ],
  cutting: [
    "cutting.read",
    "cutting.run",
    "cutting.approve",
    "cutting.create_remnants",
    "cutting.print",
  ],
  installations: [
    "installations.view",
    "installations.create",
    "installations.update",
    "installations.schedule",
    "installations.assign",
    "installations.execute",
    "installations.complete",
    "installations.cancel",
    "installations.export",
  ],
  mediciones: [
    "mediciones.ver",
    "mediciones.crear",
    "mediciones.actualizar",
    "mediciones.programar",
    "mediciones.asignar",
    "mediciones.ejecutar",
    "mediciones.aprobar",
    "mediciones.rechazar",
    "mediciones.exportar",
  ],
  inventory: [
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.adjust",
    "inventory.reserve",
    "inventory.release_reservation",
    "inventory.damage",
    "inventory.scrap",
    "inventory.view_cost",
  ],
  materials: [
    "materials.read",
    "materials.create",
    "materials.update",
    "materials.delete",
  ],
  price_lists: [
    "price_lists.read",
    "price_lists.import",
    "price_lists.validate",
    "price_lists.approve",
  ],
  production: [
    "production.read",
    "production.create",
    "production.update",
    "production.delete",
    "production.start",
    "production.complete",
    "production.consume_material",
    "production.quality_check",
    "production.view_cost",
    "production.report_waste",
  ],
  projects: [
    "projects.read",
    "projects.create",
    "projects.update",
    "projects.delete",
  ],
  rentabilidad: [
    "rentabilidad.ver",
    "rentabilidad.analizar",
    "rentabilidad.exportar",
  ],
  purchasing: [
    "purchasing.read",
    "purchasing.create",
    "purchasing.update",
    "purchasing.delete",
    "purchasing.approve",
    "purchasing.compare_suppliers",
    "purchasing.create_po",
    "purchasing.send_po",
    "purchasing.receive",
    "purchasing.view_cost",
  ],
  quotations: [
    "quotations.read",
    "quotations.create",
    "quotations.update",
    "quotations.delete",
    "quotations.send",
    "quotations.approve",
    "quotations.override_cost",
    "quotations.view_cost",
    "quotations.export_pdf",
  ],
  reports: ["reports.read", "reports.export"],
  suppliers: [
    "suppliers.read",
    "suppliers.create",
    "suppliers.update",
    "suppliers.delete",
  ],
  system: [
    "system.users.read",
    "system.users.create",
    "system.users.update",
    "system.users.delete",
    "system.roles.read",
    "system.roles.update",
    "system.settings.read",
    "system.settings.update",
    "system.audit.read",
  ],
} as const;

export const PERMISSION_GROUPS: PermissionCatalogGroup[] = Object.entries(
  PERMISSION_GROUP_DEFINITIONS,
).map(([groupKey, permissions]) => ({
  key: groupKey,
  label: formatModuleLabel(groupKey.replaceAll("_", " ")),
  permissions: permissions.map((permissionKey) => ({
    description: formatPermissionDescription(permissionKey),
    key: permissionKey,
    label: formatPermissionLabel(permissionKey),
  })),
}));

export const PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

export const CRITICAL_ADMIN_PERMISSIONS = [...PERMISSION_KEYS];

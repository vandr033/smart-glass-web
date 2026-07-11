const STATUS_LABELS = {
  ACCEPTED: "Aceptado",
  ACTIVE: "Activo",
  ADJUSTMENT: "Ajuste",
  APPROVED: "Aprobado",
  ARCHIVED: "Archivado",
  AVAILABLE: "Disponible",
  AUTO_MAPPED: "Mapeo automatico",
  BENT: "Doblado",
  BLOCKED: "Bloqueado",
  BROKEN: "Roto",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  CONFIRMED: "Confirmado",
  CONSUMED: "Consumido",
  CONVERTED_TO_PO: "Convertido en OC",
  DRAFT: "Borrador",
  EN_ROUTE: "En ruta",
  EXPIRED: "Vencido",
  FAILED: "Fallido",
  INACTIVE: "Inactivo",
  IN_INSTALLATION: "En instalacion",
  IN_PROGRESS: "En progreso",
  IN_PRODUCTION: "En produccion",
  INVALID: "Invalido",
  INSTALLATION_PENDING: "Pendiente de instalacion",
  RESCHEDULED: "Reprogramada",
  RESOLVED: "Resuelto",
  LEAD: "Prospecto",
  MANUAL_MAPPED: "Mapeo manual",
  MEASUREMENT_PENDING: "Pendiente de medicion",
  MISSING_PARTS: "Faltan piezas",
  NEEDS_MAPPING: "Requiere mapeo",
  ON_HOLD: "En espera",
  OPEN: "Abierto",
  ORDERED: "Ordenado",
  OTHER: "Otro",
  PARTIALLY_RECEIVED: "Recepcion parcial",
  PASSED: "Aprobado",
  PAUSED: "Pausado",
  PENDING: "Pendiente",
  PENDING_APPROVAL: "Pendiente de aprobacion",
  PRODUCTION_PENDING: "Pendiente de produccion",
  PURCHASE_PENDING: "Pendiente de compra",
  PURCHASE: "Compra",
  QUARANTINE: "Cuarentena",
  QUOTATION_PENDING: "Pendiente de cotizacion",
  QUOTED: "Cotizado",
  READY: "Listo",
  RECEIVED: "Recibido",
  REJECTED: "Rechazado",
  RELEASED: "Liberado",
  REMNANT: "Remanente",
  REPORTED: "Reportado",
  RESERVED_FIRM: "Reserva firme",
  RESERVED_SOFT: "Reserva blanda",
  RESERVED: "Reservado",
  RETURN: "Devolucion",
  RETURNED_TO_SUPPLIER: "Devuelto al proveedor",
  REUSABLE: "Reutilizable",
  REVIEWED: "Revisado",
  REWORK_REQUIRED: "Reproceso requerido",
  RUNNING: "En ejecucion",
  SCRATCHED: "Rayado",
  SCRAPPED: "Desechado",
  SCHEDULED: "Programada",
  SENT: "Enviado",
  SENT_TO_PRODUCTION: "Enviado a produccion",
  STANDARD: "Estandar",
  SUPPLIER_SELECTED: "Proveedor seleccionado",
  WITH_OBSERVATIONS: "Con observaciones",
  TOTAL_LOSS: "Perdida total",
  UNMAPPED: "Sin mapear",
  VALID: "Valido",
  CLOSED: "Cerrado",
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
  VIGENTE: "Vigente",
} as const;

const RESOURCE_LABELS = {
  activity_logs: "actividad",
  audit: "auditoria",
  audit_log: "auditoria",
  clients: "clientes",
  cutting: "corte",
  installation: "instalacion",
  invitations: "invitaciones",
  indicadores: "indicadores",
  inventory: "inventario",
  installations: "instalaciones",
  materials: "materiales",
  notifications: "notificaciones",
  permissions: "permisos",
  postventa: "postventa",
  price_lists: "listas de precios",
  production: "produccion",
  products: "productos",
  projects: "proyectos",
  purchasing: "compras",
  quotations: "cotizaciones",
  rentabilidad: "rentabilidad",
  reportes: "reportes",
  reports: "reportes",
  roles: "roles",
  settings: "configuracion",
  supplier_categories: "categorias de proveedores",
  supplier_scoring: "evaluacion de proveedores",
  suppliers: "proveedores",
  system: "sistema",
  tableros: "tableros ejecutivos",
  users: "usuarios",
  garantias: "garantias",
} as const;

const ACTION_LABELS = {
  adjust: "ajustar",
  approve: "aprobar",
  analizar: "analizar",
  assign: "asignar",
  cancel: "cancelar",
  cerrar: "cerrar",
  configurar: "configurar",
  compare_suppliers: "comparar proveedores",
  complete: "completar",
  consume_material: "consumir material",
  create: "crear",
  create_po: "crear ordenes de compra",
  create_remnants: "crear remanentes",
  damage: "reportar dano",
  delete: "eliminar",
  execute: "ejecutar",
  export: "exportar",
  exportar: "exportar",
  export_pdf: "exportar PDF",
  import: "importar",
  override_cost: "sobrescribir costos",
  print: "imprimir",
  quality_check: "control de calidad",
  read: "ver",
  receive: "recibir",
  release_reservation: "liberar reservas",
  report_waste: "reportar merma",
  reserve: "reservar",
  run: "ejecutar",
  scrap: "desechar",
  schedule: "programar",
  send: "enviar",
  send_po: "enviar ordenes de compra",
  start: "iniciar",
  update: "actualizar",
  validate: "validar",
  ver: "ver",
  view: "ver",
  view_cost: "ver costos",
} as const;

const MODULE_LABELS = {
  "Activity Logs": "Actividad",
  "Admin": "Configuracion",
  "Audit Log": "Auditoria",
  "Clients": "Clientes",
  "Commercial": "Comercial",
  "Configuration": "Configuracion",
  "Cutting": "Corte",
  "Dashboard": "Panel principal",
  "ERP Control Center": "Centro ERP",
  "ERP Foundation": "Vidriera Sebitas ERP",
  "Glass & Aluminum ERP": "Vidriera Sebitas ERP",
  "Invitations": "Invitaciones",
  "Inventory": "Inventario",
  "Inventory Stock": "Inventario",
  "Inventory Movements": "Movimientos de inventario",
  "Installation": "Instalaciones",
  "Installations": "Instalaciones",
  "Materials": "Materiales",
  "Material Categories": "Categorias de materiales",
  "Notifications": "Notificaciones",
  "Operations": "Operaciones",
  "Pending Quotation": "Cotizaciones pendientes",
  "Overview": "Resumen",
  "Price History": "Historial de precios",
  "Price Lists": "Listas de precios",
  Postventa: "Postventa",
  "Profile Optimization": "Optimizacion de perfiles",
  "Profile Cutting Plans": "Planes de corte de perfiles",
  "Production": "Produccion",
  "Production Home": "Centro de produccion",
  "Production Jobs": "Ordenes de trabajo",
  "Products": "Productos",
  "Projects": "Proyectos",
  "Purchasing": "Compras",
  "Rentabilidad": "Rentabilidad",
  "Tableros ejecutivos": "Tableros ejecutivos",
  "Purchase Orders": "Ordenes de compra",
  "Purchase Requests": "Solicitudes de compra",
  "Quotations": "Cotizaciones",
  "Receipts": "Recepciones",
  indicadores: "Indicadores de gestion",
  reportes: "Reportes de inteligencia de negocio",
  "Reports": "Reportes",
  "Roles": "Roles",
  "Roles & Permissions": "Roles y permisos",
  "Settings": "Configuracion",
  "Supplier Equivalences": "Equivalencias de proveedor",
  "Supplier Categories": "Categorias de proveedores",
  "Supplier Scoring": "Puntajes de proveedor",
  "Suppliers": "Proveedores",
  "System": "Sistema",
  "System Settings": "Configuracion del sistema",
  tableros: "Tableros ejecutivos",
  "Users": "Usuarios",
  "Visible Modules": "Modulos visibles",
} as const;

const MATERIAL_BEHAVIOR_LABELS = {
  LINEAR: "Lineal",
  PACKAGE: "Paquete",
  SERVICE: "Servicio",
  SHEET: "Vidrio en plancha",
  UNIT: "Unidad",
} as const;

const PRODUCTION_TASK_TYPE_LABELS = {
  ASSEMBLE: "Ensamblado",
  CUT_GLASS: "Corte de vidrio",
  CUT_PROFILE: "Corte de perfil",
  MEASURE: "Medicion",
  OTHER: "Otro",
  PACK: "Embalaje",
  QUALITY_CHECK: "Control de calidad",
} as const;

const PURCHASE_SOURCE_LABELS = {
  CUTTING_PLAN: "Plan de corte",
  INVENTORY_SHORTAGE: "Falta de inventario",
  MANUAL: "Manual",
  PROJECT: "Proyecto",
  QUOTATION: "Cotizacion",
} as const;

const QUOTATION_ITEM_TYPE_LABELS = {
  DISCOUNT: "Descuento",
  MANUAL_MATERIAL: "Material manual",
  MANUAL_SERVICE: "Servicio manual",
  NOTE: "Nota",
  TEMPLATE_PRODUCT: "Producto de plantilla",
} as const;

const QUOTATION_APPROVAL_TYPE_LABELS = {
  HIGH_DISCOUNT: "Descuento alto",
  LOW_MARGIN: "Margen bajo",
  MANUAL_REVIEW: "Revision manual",
  PRICE_EXCEPTION: "Excepcion de precio",
} as const;

const PROJECT_TYPE_LABELS = {
  CUSTOM: "Personalizado",
  DOOR: "Puerta",
  FACADE: "Fachada",
  MIRROR: "Espejo",
  RAILING: "Baranda",
  SERVICE: "Servicio",
  SHOWER: "Mampara",
  WINDOW: "Ventana",
} as const;

const PROJECT_PRIORITY_LABELS = {
  HIGH: "Alta",
  LOW: "Baja",
  NORMAL: "Normal",
  URGENT: "Urgente",
} as const;

const CLIENT_TYPE_LABELS = {
  COMPANY: "Empresa",
  INDIVIDUAL: "Persona",
} as const;

const DAMAGE_SEVERITY_LABELS = {
  HIGH: "Alta",
  LOW: "Baja",
  MEDIUM: "Media",
  TOTAL_LOSS: "Perdida total",
} as const;

const BOOL_LABELS = {
  no: "No",
  notAvailable: "No disponible",
  yes: "Si",
} as const;

const ENUM_FALLBACK_SEGMENT_LABELS = {
  actions: "Acciones",
  active: "Activo",
  admin: "Administracion",
  approved: "Aprobado",
  audit: "Auditoria",
  cancelled: "Cancelado",
  client: "Cliente",
  clients: "Clientes",
  comparison: "Comparativo",
  comparisons: "Comparativos",
  create: "Crear",
  cutting: "Corte",
  dashboard: "Panel",
  delete: "Eliminar",
  detail: "Detalle",
  draft: "Borrador",
  edit: "Editar",
  export: "Exportar",
  filter: "Filtro",
  filters: "Filtros",
  foundation: "Base",
  glass: "Vidrio",
  history: "Historial",
  home: "Inicio",
  inactive: "Inactivo",
  installation: "Instalacion",
  installations: "Instalaciones",
  inventory: "Inventario",
  job: "Trabajo",
  jobs: "Trabajos",
  lead: "Entrega",
  lists: "Listas",
  material: "Material",
  materials: "Materiales",
  module: "Modulo",
  modules: "Modulos",
  movement: "Movimiento",
  movements: "Movimientos",
  optimization: "Optimizacion",
  order: "Orden",
  orders: "Ordenes",
  pending: "Pendiente",
  permission: "Permiso",
  permissions: "Permisos",
  plan: "Plan",
  plans: "Planes",
  preference: "Preferencia",
  preview: "Vista previa",
  price: "Precio",
  prices: "Precios",
  production: "Produccion",
  profile: "Perfil",
  project: "Proyecto",
  projects: "Proyectos",
  purchase: "Compra",
  purchasing: "Compras",
  quotation: "Cotizacion",
  quotations: "Cotizaciones",
  refresh: "Actualizar",
  reliability: "Confiabilidad",
  remnant: "Remanente",
  remnants: "Remanentes",
  report: "Reporte",
  reports: "Reportes",
  request: "Solicitud",
  requests: "Solicitudes",
  search: "Buscar",
  settings: "Configuracion",
  shared: "Compartido",
  sidebar: "Navegacion",
  stock: "Stock",
  supplier: "Proveedor",
  suppliers: "Proveedores",
  update: "Actualizar",
  view: "Ver",
  warehouse: "Almacen",
} as const;

const getFallbackLabel = (value: string): string => {
  return value
    .split(/[_\-. ]+/)
    .filter(Boolean)
    .map((part) => {
      const normalizedPart = part.toLowerCase();
      const translatedPart =
        ENUM_FALLBACK_SEGMENT_LABELS[
          normalizedPart as keyof typeof ENUM_FALLBACK_SEGMENT_LABELS
        ];

      if (translatedPart) {
        return translatedPart;
      }

      return normalizedPart.charAt(0).toUpperCase() + normalizedPart.slice(1);
    })
    .join(" ");
};

export const formatModuleLabel = (value: string): string => {
  return MODULE_LABELS[value as keyof typeof MODULE_LABELS] ?? getFallbackLabel(value);
};

export const formatStatusLabel = (value: string): string => {
  return STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? getFallbackLabel(value);
};

export const formatEnumLabel = (value: string): string => {
  return getFallbackLabel(value);
};

export const formatPermissionLabel = (permission: string): string => {
  const [resource = permission, action = "view"] = permission.split(".");

  const resourceLabel =
    RESOURCE_LABELS[resource as keyof typeof RESOURCE_LABELS] ?? formatEnumLabel(resource);
  const actionLabel =
    ACTION_LABELS[action as keyof typeof ACTION_LABELS] ?? formatEnumLabel(action).toLowerCase();

  return `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} ${resourceLabel}`;
};

export const formatPermissionDescription = (permission: string): string => {
  const [resource = permission, action = "view"] = permission.split(".");
  const resourceLabel =
    RESOURCE_LABELS[resource as keyof typeof RESOURCE_LABELS] ?? formatEnumLabel(resource).toLowerCase();

  const descriptions: Record<string, string> = {
    adjust: `Permite ajustar ${resourceLabel}.`,
    approve: `Permite aprobar ${resourceLabel}.`,
    assign: `Permite asignar ${resourceLabel}.`,
    cerrar: `Permite cerrar ${resourceLabel}.`,
    compare_suppliers: "Permite comparar proveedores aprobados.",
    complete: `Permite completar ${resourceLabel}.`,
    consume_material: "Permite consumir material en la operacion.",
    create: `Permite crear ${resourceLabel}.`,
    create_po: "Permite crear ordenes de compra.",
    create_remnants: "Permite generar remanentes a partir de cortes aprobados.",
    damage: "Permite reportar material danado.",
    delete: `Permite eliminar ${resourceLabel}.`,
    export: `Permite exportar ${resourceLabel}.`,
    exportar: `Permite exportar ${resourceLabel}.`,
    export_pdf: "Permite exportar cotizaciones en PDF.",
    import: `Permite importar ${resourceLabel}.`,
    override_cost: "Permite sobrescribir valores de costo.",
    print: "Permite imprimir layouts y documentos.",
    quality_check: "Permite registrar controles de calidad.",
    read: `Permite consultar ${resourceLabel}.`,
    receive: "Permite recibir ordenes de compra en inventario.",
    release_reservation: "Permite liberar reservas activas.",
    report_waste: "Permite registrar y revisar merma.",
    reserve: "Permite reservar inventario para trabajos posteriores.",
    run: "Permite ejecutar procesos operativos.",
    scrap: "Permite desechar saldos no utilizables.",
    send: `Permite enviar ${resourceLabel}.`,
    send_po: "Permite enviar ordenes de compra a proveedores.",
    start: `Permite iniciar ${resourceLabel}.`,
    update: `Permite actualizar ${resourceLabel}.`,
    validate: `Permite validar ${resourceLabel}.`,
    ver: `Permite ver ${resourceLabel}.`,
    view: `Permite ver ${resourceLabel}.`,
    view_cost: "Permite ver informacion de costos.",
    analizar: `Permite analizar ${resourceLabel}.`,
  };

  return descriptions[action] ?? `Permite gestionar ${resourceLabel}.`;
};

export const formatMaterialBehaviorType = (value: string): string => {
  return (
    MATERIAL_BEHAVIOR_LABELS[value as keyof typeof MATERIAL_BEHAVIOR_LABELS] ??
    formatStatusLabel(value)
  );
};

export const formatQuotationStatus = (value: string): string => {
  return formatStatusLabel(value);
};

export const formatPurchaseStatus = (value: string): string => {
  return formatStatusLabel(value);
};

export const formatProductionStatus = (value: string): string => {
  return formatStatusLabel(value);
};

export const formatQuotationItemType = (value: string): string => {
  return (
    QUOTATION_ITEM_TYPE_LABELS[value as keyof typeof QUOTATION_ITEM_TYPE_LABELS] ??
    formatStatusLabel(value)
  );
};

export const formatQuotationApprovalType = (value: string): string => {
  return (
    QUOTATION_APPROVAL_TYPE_LABELS[
      value as keyof typeof QUOTATION_APPROVAL_TYPE_LABELS
    ] ?? formatStatusLabel(value)
  );
};

export const formatPurchaseSourceType = (value: string): string => {
  return (
    PURCHASE_SOURCE_LABELS[value as keyof typeof PURCHASE_SOURCE_LABELS] ??
    formatStatusLabel(value)
  );
};

export const formatProjectType = (value: string): string => {
  return PROJECT_TYPE_LABELS[value as keyof typeof PROJECT_TYPE_LABELS] ?? getFallbackLabel(value);
};

export const formatProjectPriority = (value: string): string => {
  return (
    PROJECT_PRIORITY_LABELS[value as keyof typeof PROJECT_PRIORITY_LABELS] ??
    getFallbackLabel(value)
  );
};

export const formatProductionTaskType = (value: string): string => {
  return (
    PRODUCTION_TASK_TYPE_LABELS[value as keyof typeof PRODUCTION_TASK_TYPE_LABELS] ??
    getFallbackLabel(value)
  );
};

export const formatClientType = (value: string): string => {
  return CLIENT_TYPE_LABELS[value as keyof typeof CLIENT_TYPE_LABELS] ?? getFallbackLabel(value);
};

export const formatDamageSeverity = (value: string): string => {
  return (
    DAMAGE_SEVERITY_LABELS[value as keyof typeof DAMAGE_SEVERITY_LABELS] ??
    getFallbackLabel(value)
  );
};

export const formatDateValue = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatDateOnlyValue = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatDimensionMm = (value: number | null): string => {
  if (value === null) {
    return "No definido";
  }

  return `${value.toLocaleString("es-BO")} mm`;
};

export const formatDimensionMeters = (value: number | null): string => {
  if (value === null) {
    return "No definido";
  }

  return `${(value / 1000).toLocaleString("es-BO", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  })} m`;
};

export const formatBooleanLabel = (value: boolean): string => {
  return value ? BOOL_LABELS.yes : BOOL_LABELS.no;
};

export const formatUnavailableLabel = (): string => {
  return BOOL_LABELS.notAvailable;
};

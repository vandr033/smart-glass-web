const ROLE_DESCRIPTION_BY_NAME: Record<string, string> = {
  ACCOUNTING:
    "Acceso contable para revisar información operativa, reportes y registros financieros del ERP.",
  ADMIN:
    "Acceso operativo amplio, excluyendo las acciones más sensibles de eliminación y configuración del sistema.",
  INSTALLATION:
    "Acceso para programación, coordinación y ejecución de instalaciones en campo.",
  MANAGER:
    "Acceso gerencial transversal para supervisión operativa, aprobación comercial y seguimiento de reportes.",
  PRODUCTION:
    "Acceso de producción para planificar, ejecutar y cerrar trabajos con trazabilidad de materiales.",
  PURCHASING:
    "Acceso de compras para proveedores, materiales, listas de precios y flujos de abastecimiento.",
  READ_ONLY:
    "Visibilidad de solo lectura sobre registros, reportes e indicadores del negocio.",
  SALES:
    "Acceso comercial para clientes, proyectos, cotizaciones y exportación de reportes.",
  SUPER_ADMIN:
    "Acceso completo a todos los módulos base y ERP.",
  WAREHOUSE:
    "Acceso de almacén para control de inventario, recepciones y reservas de stock.",
};

export const getRoleDescription = (
  roleName: string,
  fallbackDescription: string | null | undefined,
): string => {
  const localizedDescription = ROLE_DESCRIPTION_BY_NAME[roleName];

  if (localizedDescription) {
    return localizedDescription;
  }

  return fallbackDescription?.trim() || "Sin descripción disponible.";
};

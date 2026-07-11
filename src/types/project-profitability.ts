import type { ProjectStatus, ProjectType } from "./projects";

export type RentabilidadProyectoEstado =
  | "EN_EJECUCION"
  | "PENDIENTE_DE_CIERRE"
  | "CERRADO"
  | "ANALIZADO";

export type CostoProyectoCategoria =
  | "MATERIALES"
  | "MANO_DE_OBRA"
  | "PRODUCCION"
  | "INSTALACION"
  | "COMPRAS"
  | "TRANSPORTE"
  | "GARANTIAS"
  | "RECLAMOS"
  | "REPOSICIONES"
  | "OTROS";

export type CostoProyectoOrigen =
  | "COTIZACION"
  | "ORDEN_COMPRA"
  | "RECEPCION"
  | "CONSUMO_INVENTARIO"
  | "PRODUCCION"
  | "INSTALACION"
  | "GARANTIA"
  | "POSTVENTA"
  | "OPTIMIZACION"
  | "DERIVADO"
  | "OTRO";

export type AlertaRentabilidadTipo =
  | "MARGEN_BAJO"
  | "SOBRECOSTO"
  | "DESPERDICIO_EXCEDIDO"
  | "PROYECTO_EN_PERDIDA";

export type RentabilidadUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type RentabilidadClientSummary = {
  clientType: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  id: string;
};

export type RentabilidadProjectSummary = {
  client: RentabilidadClientSummary;
  code: string;
  id: string;
  projectType: ProjectType;
  responsibleUser: RentabilidadUserSummary;
  salesUser: RentabilidadUserSummary;
  status: ProjectStatus;
  title: string;
};

export type RentabilidadProyectoRecord = {
  calculadoEn: string;
  costoInstalacionPresupuestado: number;
  costoInstalacionReal: number;
  costoManoObraPresupuestado: number;
  costoManoObraReal: number;
  costoMaterialPresupuestado: number;
  costoMaterialReal: number;
  diferenciaContraPresupuesto: number;
  estado: RentabilidadProyectoEstado;
  id: string;
  ingresoPresupuestado: number;
  ingresoReal: number;
  margenBruto: number;
  proyectoId: string;
  totalCostoPresupuestado: number;
  totalCostoReal: number;
  utilidadBruta: number;
  desperdicioPresupuestado: number;
  desperdicioReal: number;
};

export type CostoProyectoRecord = {
  categoria: CostoProyectoCategoria;
  descripcion: string;
  fecha: string;
  id: string;
  monto: number;
  origen: CostoProyectoOrigen;
  proyectoId: string;
  referenciaId: string | null;
};

export type EventoRentabilidadRecord = {
  creadoEn: string;
  descripcion: string;
  id: string;
  impacto: number;
  proyectoId: string;
  tipo:
    | "COTIZACION_BASE"
    | "COSTO_REAL"
    | "DESPERDICIO"
    | "ALERTA"
    | "PRODUCCION"
    | "INSTALACION"
    | "COMPRA"
    | "RECEPCION"
    | "POSTVENTA";
};

export type AlertaRentabilidadRecord = {
  descripcion: string;
  id: string;
  impacto: number;
  severidad: "ALTA" | "MEDIA" | "BAJA";
  tipo: AlertaRentabilidadTipo;
};

export type VariacionRentabilidadRecord = {
  diferencia: number;
  etiqueta: string;
  porcentaje: number | null;
  presupuestado: number;
  real: number;
};

export type IndicadoresRentabilidadRecord = {
  margenNeto: number;
  rentabilidadPorMetroCuadrado: number | null;
  rentabilidadPorProyecto: number;
  recuperacionPorRemanentes: number;
  desperdicioGenerado: number;
};

export type RentabilidadAgrupadaRecord = {
  clave: string;
  margenPromedio: number;
  nombre: string;
  proyectos: number;
  utilidadTotal: number;
  ventaTotal: number;
};

export type RentabilidadProyectoListItem = {
  alertas: AlertaRentabilidadRecord[];
  indicadores: IndicadoresRentabilidadRecord;
  proyecto: RentabilidadProjectSummary;
  rentabilidad: RentabilidadProyectoRecord;
};

export type RentabilidadProyectoDetailRecord = RentabilidadProyectoListItem & {
  costos: CostoProyectoRecord[];
  eventos: EventoRentabilidadRecord[];
  metodologia: string[];
  reportes: {
    porCliente: RentabilidadAgrupadaRecord[];
    porTipoProducto: RentabilidadAgrupadaRecord[];
    porVendedor: RentabilidadAgrupadaRecord[];
  };
  variaciones: {
    costos: VariacionRentabilidadRecord;
    ingresos: VariacionRentabilidadRecord;
    instalacion: VariacionRentabilidadRecord;
    manoDeObra: VariacionRentabilidadRecord;
    materiales: VariacionRentabilidadRecord;
  };
};

export type RentabilidadProyectoDashboardRecord = {
  desperdicioPromedio: number;
  margenPromedio: number;
  proyectosMasRentables: RentabilidadProyectoListItem[];
  proyectosMenosRentables: RentabilidadProyectoListItem[];
  proyectosRentables: number;
  reportes: {
    porCliente: RentabilidadAgrupadaRecord[];
    porTipoProducto: RentabilidadAgrupadaRecord[];
    porVendedor: RentabilidadAgrupadaRecord[];
  };
  totalProyectos: number;
  utilidadTotal: number;
};

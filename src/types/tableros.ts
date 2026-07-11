export type CategoriaTablero =
  | "Comercial"
  | "Operaciones"
  | "Produccion"
  | "Inventario"
  | "Compras"
  | "Instalaciones"
  | "Rentabilidad"
  | "Postventa";

export type UnidadIndicador = "dias" | "moneda" | "numero" | "porcentaje" | "veces";

export interface TableroEjecutivoRecord {
  actualizadoEn: string;
  creadoEn: string;
  creadoPor: string;
  descripcion: string;
  id: string;
  nombre: string;
  tipo: string;
  visibleParaRoles: string[];
}

export interface IndicadorGestionRecord {
  actualizadoEn: string;
  categoria: CategoriaTablero;
  codigo: string;
  descripcion: string;
  formula: string;
  id: string;
  meta: number | null;
  nombre: string;
  periodo: string;
  tendencia: "ALZA" | "BAJA" | "ESTABLE";
  unidad: UnidadIndicador;
  valorActual: number;
  variacion: number | null;
}

export interface MetaIndicadorRecord {
  estado: "ALCANZADA" | "EN_RIESGO" | "VIGENTE";
  id: string;
  indicadorId: string;
  periodo: string;
  responsableId: string | null;
  valorMeta: number;
}

export interface ReporteBIRecord {
  archivoUrl: string | null;
  filtros: Record<string, string | null>;
  generadoEn: string;
  generadoPor: string | null;
  id: string;
  nombre: string;
  tipo: "Datos base Excel" | "Indicadores Excel" | "Reporte PDF";
}

export interface TarjetaIndicadorRecord {
  categoria: CategoriaTablero;
  codigo: string;
  descripcion: string;
  id: string;
  meta: number | null;
  titulo: string;
  tendencia: "ALZA" | "BAJA" | "ESTABLE";
  unidad: Exclude<UnidadIndicador, "veces">;
  valor: number;
  variacion: number | null;
}

export interface SerieTemporalRecord {
  etiqueta: string;
  periodo: string;
  valor: number;
  valorSecundario?: number;
}

export interface SerieValorRecord {
  color: string;
  etiqueta: string;
  porcentaje: number | null;
  valor: number;
}

export interface RankingRecord {
  descripcion: string;
  etiqueta: string;
  id: string;
  secundario: string | null;
  valor: number;
}

export interface ComparativaRecord {
  detalle: string;
  etiqueta: string;
  meta: number | null;
  unidad: UnidadIndicador;
  valor: number;
}

export interface PanelSeccionComercialRecord {
  conversion: {
    aprobadas: number;
    emitidas: number;
    tasa: number;
  };
  cotizacionesPorEstado: SerieValorRecord[];
  proyectosResultado: SerieValorRecord[];
  ventasPorCliente: RankingRecord[];
  ventasPorPeriodo: SerieTemporalRecord[];
  ventasPorVendedor: RankingRecord[];
}

export interface PanelSeccionOperacionesRecord {
  alertasOperativas: RankingRecord[];
  cumplimiento: ComparativaRecord[];
  instalacionesPorEstado: SerieValorRecord[];
  ordenesTrabajoPorEstado: SerieValorRecord[];
}

export interface PanelSeccionInventarioRecord {
  materialesCriticos: RankingRecord[];
  rotacion: SerieValorRecord[];
  stockBajo: RankingRecord[];
  resumen: ComparativaRecord[];
}

export interface PanelSeccionFinancieraRecord {
  desviacionProyectos: RankingRecord[];
  proyectosEnPerdida: RankingRecord[];
  resumen: SerieValorRecord[];
}

export interface PanelSeccionPostventaRecord {
  estados: SerieValorRecord[];
  reclamosPorProyecto: RankingRecord[];
  reclamosPorTipo: SerieValorRecord[];
  resumen: ComparativaRecord[];
}

export interface PanelEjecutivoRecord {
  actualizadoEn: string;
  filtrosAplicados: {
    clientId: string | null;
    dateFrom: string;
    dateTo: string;
    projectId: string | null;
    responsibleId: string | null;
    salesUserId: string | null;
    status: string | null;
    warehouseId: string | null;
  };
  indicadores: IndicadorGestionRecord[];
  metas: MetaIndicadorRecord[];
  reportes: ReporteBIRecord[];
  secciones: {
    comercial: PanelSeccionComercialRecord;
    financiero: PanelSeccionFinancieraRecord;
    inventario: PanelSeccionInventarioRecord;
    operaciones: PanelSeccionOperacionesRecord;
    postventa: PanelSeccionPostventaRecord;
  };
  tablero: TableroEjecutivoRecord;
  tarjetas: TarjetaIndicadorRecord[];
}

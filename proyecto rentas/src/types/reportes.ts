export interface DashboardStats {
  totalLocales: number;
  ocupacionPorcentaje: number;
  ingresosMes: number;
  morosidad: number;
  totalInquilinos: number;
  contratosVigentes: number;
  ingresosAnuales: number;
  promedioRenta: number;
}

export interface IngresoMensual {
  mes: string;
  año: number;
  montoEsperado: number;
  montoPagado: number;
  diferencia: number;
  porcentajeCobranza: number;
}

export interface MorosidadDetalle {
  contratoId: string;
  inquilinoId: string;
  inquilinoNombre: string;
  localId: string;
  localNombre: string;
  montoRenta: number;
  diasAtraso: number;
  mesesAdeudados: number;
  deudaTotal: number;
  ultimoPago?: Date;
  estado: 'critico' | 'medio' | 'leve';
}

export interface RenovacionProxima {
  contratoId: string;
  inquilinoId: string;
  inquilinoNombre: string;
  localId: string;
  localNombre: string;
  fechaFin: Date;
  diasRestantes: number;
  montoRenta: number;
  email: string;
  telefono: string;
}

export interface OcupacionHistorica {
  mes: string;
  totalLocales: number;
  ocupados: number;
  disponibles: number;
  mantenimiento: number;
  tasaOcupacion: number;
}

export interface ReporteFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  localId?: string;
  tipo?: string;
  diasAtrasoMin?: number;
}

export interface ExportConfig {
  formato: 'pdf' | 'csv' | 'excel';
  incluirGraficos?: boolean;
  orientacion?: 'portrait' | 'landscape';
}
export interface Renovacion {
  fecha: Date;
  nuevoFin: Date;
  nuevoMonto: number;
  motivo: string;
}

export interface Contrato {
  id: string;
  localId: string;
  inquilinoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  montoRenta: number;
  diaPago: number;
  depositoGarantia: number;
  formaPago: 'transferencia' | 'efectivo' | 'cheque' | 'otro';
  clausulas: string;
  documentoUrl: string | null;
  estado: 'vigente' | 'vencido' | 'renovado' | 'rescindido';
  renovaciones: Renovacion[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor: string;
  // Campos calculados
  localNombre?: string;
  inquilinoNombre?: string;
  diasRestantes?: number;
  estadoPago?: 'pagado' | 'pendiente' | 'atrasado';
  totalPagado?: number;
  mesesPagados?: number;
}

export interface ContratoFormData {
  localId: string;
  inquilinoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  montoRenta: number;
  diaPago: number;
  depositoGarantia: number;
  formaPago: 'transferencia' | 'efectivo' | 'cheque' | 'otro';
  clausulas: string;
  documentoUrl?: string | null;
  estado?: 'vigente' | 'vencido' | 'renovado' | 'rescindido';
}

export interface ContratoFilters {
  estado?: string;
  localId?: string;
  inquilinoId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  busqueda?: string;
}
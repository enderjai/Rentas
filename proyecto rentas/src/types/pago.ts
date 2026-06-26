export interface Pago {
  id: string;
  contratoId: string;
  fechaPago: Date;
  monto: number;
  metodo: 'transferencia' | 'efectivo' | 'cheque' | 'tarjeta';
  comprobante: string;
  mesCorrespondiente: string; // YYYY-MM
  observaciones: string;
  registradoPor: string;
  fechaRegistro: Date;
  inquilinoId: string;
  localId: string;
  // Campos calculados
  inquilinoNombre?: string;
  localNombre?: string;
  numeroRecibo?: string;
}

export interface PagoFormData {
  contratoId: string;
  fechaPago: Date;
  monto: number;
  metodo: 'transferencia' | 'efectivo' | 'cheque' | 'tarjeta';
  comprobante: string;
  mesCorrespondiente: string;
  observaciones: string;
  inquilinoId: string;
  localId: string;
}

export interface EstadoPago {
  contratoId: string;
  mes: string;
  estado: 'pagado' | 'pendiente' | 'atrasado';
  diasAtraso: number;
  montoAdeudado: number;
  fechaEsperada: Date;
  pagosRealizados: Pago[];
}

export interface DeudaTotal {
  contratoId: string;
  totalAdeudado: number;
  mesesAdeudados: number;
  primerMesAdeudado: string;
  ultimoMesAdeudado: string;
  pagosRealizados: Pago[];
}

export interface PagoFilters {
  contratoId?: string;
  inquilinoId?: string;
  localId?: string;
  mes?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  metodo?: string;
}

export interface ConfiguracionMorosidad {
  tasaInteresMensual: number; // Porcentaje
  diasGracia: number;
  cobrarInteres: boolean;
}
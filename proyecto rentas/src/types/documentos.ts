export interface Documento {
  id: string;
  nombre: string;
  url: string;
  tipo: 'plano' | 'foto' | 'inspeccion' | 'contrato' | 'identificacion' | 'domicilio' | 'referencia' | 'recibo' | 'otro';
  entidadTipo: 'local' | 'inquilino' | 'contrato' | 'pago';
  entidadId: string;
  fechaSubida: Date;
  subidoPor: string;
  visibilidad: 'admin' | 'inquilino' | 'publico';
  descripcion: string;
  tamaño: number;
  mimeType?: string;
  metadata?: {
    width?: number;
    height?: number;
    thumbnail?: string;
  };
}

export interface DocumentoFormData {
  nombre: string;
  tipo: 'plano' | 'foto' | 'inspeccion' | 'contrato' | 'identificacion' | 'domicilio' | 'referencia' | 'recibo' | 'otro';
  visibilidad: 'admin' | 'inquilino' | 'publico';
  descripcion: string;
  archivo: File;
}

export interface DocumentoFiltros {
  entidadTipo?: string;
  entidadId?: string;
  tipo?: string;
  visibilidad?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface DocumentoStats {
  total: number;
  porTipo: Record<string, number>;
  porEntidad: Record<string, number>;
  totalSize: number;
  ultimaSubida: Date | null;
}
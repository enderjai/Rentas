export interface Documento {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  fechaSubida: Date;
  visibilidad: 'admin' | 'inquilino' | 'publico';
  tamano?: number;
}

export interface HistorialOcupante {
  inquilinoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  contratoId: string;
  inquilinoNombre?: string;
}

export interface Local {
  id: string;
  nombre: string;
  direccion: string;
  tipo: 'local' | 'oficina' | 'bodega';
  metros: number;
  estado: 'ocupado' | 'disponible' | 'mantenimiento';
  descripcion: string;
  documentos: Documento[];
  historialOcupantes: HistorialOcupante[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadoPor: string;
}

export interface LocalFormData {
  nombre: string;
  direccion: string;
  tipo: 'local' | 'oficina' | 'bodega';
  metros: number;
  estado: 'ocupado' | 'disponible' | 'mantenimiento';
  descripcion: string;
}

export interface Contrato {
  id: string;
  localId: string;
  inquilinoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  montoRenta: number;
  diaPago: number;
  estado: 'vigente' | 'finalizado' | 'cancelado';
}

export interface Inquilino {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rfc: string;
}
export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface DocumentoInquilino {
  id: string;
  nombre: string;
  url: string;
  tipo: 'identificacion' | 'domicilio' | 'referencia' | 'otro';
  fechaSubida: Date;
  tamano?: number;
}

export interface Inquilino {
  id: string;
  nombre: string;
  rfc: string;
  email: string;
  telefono: string;
  contactoEmergencia: ContactoEmergencia;
  tipo: 'persona' | 'empresa';
  documentos: DocumentoInquilino[];
  contratos: string[]; // IDs de contratos
  localActual: string | null; // ID del local actual
  fechaCreacion: Date;
  fechaActualizacion: Date;
  activo: boolean;
  userId?: string; // ID del usuario en Auth
  // Campos calculados
  localNombre?: string;
  contratoActual?: any;
}

export interface InquilinoFormData {
  nombre: string;
  rfc: string;
  email: string;
  telefono: string;
  contactoEmergencia: ContactoEmergencia;
  tipo: 'persona' | 'empresa';
  activo: boolean;
  crearUsuario?: boolean;
}

export interface InquilinoFilters {
  busqueda?: string;
  activo?: boolean;
  tipo?: 'persona' | 'empresa' | 'todos';
}
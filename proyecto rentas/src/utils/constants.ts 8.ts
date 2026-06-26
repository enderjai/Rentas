export const DOCUMENTO_COLECCION = 'documentos';
export const DOCUMENTO_TIPOS = [
  { value: 'plano', label: 'Plano', icon: '📐', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'foto', label: 'Foto', icon: '📸', mimeTypes: ['image/*'] },
  { value: 'inspeccion', label: 'Inspección', icon: '🔍', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'contrato', label: 'Contrato', icon: '📄', mimeTypes: ['application/pdf'] },
  { value: 'identificacion', label: 'Identificación', icon: '🪪', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'domicilio', label: 'Comprobante Domicilio', icon: '🏠', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'referencia', label: 'Referencia', icon: '📋', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'recibo', label: 'Recibo', icon: '🧾', mimeTypes: ['image/*', 'application/pdf'] },
  { value: 'otro', label: 'Otro', icon: '📎', mimeTypes: ['*/*'] }
];

export const ENTIDAD_TIPOS = [
  { value: 'local', label: 'Local' },
  { value: 'inquilino', label: 'Inquilino' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'pago', label: 'Pago' }
];

export const VISIBILIDAD_OPCIONES = [
  { value: 'admin', label: 'Solo Administradores' },
  { value: 'inquilino', label: 'Inquilino y Administradores' },
  { value: 'publico', label: 'Público' }
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
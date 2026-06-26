export const INQUILINO_TIPOS = [
  { value: 'persona', label: 'Persona Física' },
  { value: 'empresa', label: 'Empresa' }
] as const;

export const DOCUMENTO_TIPOS = [
  { value: 'identificacion', label: 'Identificación Oficial' },
  { value: 'domicilio', label: 'Comprobante de Domicilio' },
  { value: 'referencia', label: 'Referencia' },
  { value: 'otro', label: 'Otro' }
] as const;

export const INQUILINO_COLECCION = 'inquilinos';
export const USUARIOS_COLECCION = 'usuarios';
export const NOTIFICACION_COLECCION = 'notificaciones';
export const PREFERENCIAS_COLECCION = 'preferencias_notificaciones';
export const CONFIGURACION_COLECCION = 'configuracion_notificaciones';

export const TIPOS_NOTIFICACION = [
  { value: 'pago_recordatorio', label: 'Recordatorio de Pago', icon: '💳' },
  { value: 'pago_atraso', label: 'Aviso de Atraso', icon: '⚠️' },
  { value: 'vencimiento', label: 'Vencimiento de Contrato', icon: '📅' },
  { value: 'contrato_renovacion', label: 'Renovación de Contrato', icon: '🔄' },
  { value: 'pago_recibo', label: 'Recibo de Pago', icon: '📄' },
  { value: 'general', label: 'General', icon: '📢' }
];

export const CANALES_NOTIFICACION = [
  { value: 'inapp', label: 'En App', icon: '📱' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'push', label: 'Push Notification', icon: '🔔' },
  { value: 'all', label: 'Todos', icon: '🌐' }
];
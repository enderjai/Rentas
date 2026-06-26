export interface Notificacion {
  id: string;
  destinatario: string; // uid del usuario
  destinatarioEmail: string;
  tipo: 'pago_recordatorio' | 'pago_atraso' | 'vencimiento' | 'contrato_renovacion' | 'pago_recibo' | 'general';
  titulo: string;
  mensaje: string;
  datos: {
    contratoId?: string;
    pagoId?: string;
    localId?: string;
    inquilinoId?: string;
    monto?: number;
    diasAtraso?: number;
    fechaVencimiento?: string;
    [key: string]: any;
  };
  leida: boolean;
  fecha: Date;
  fechaLectura: Date | null;
  enlace: string | null;
  enviada: boolean;
  fechaEnvio: Date | null;
  canal: 'push' | 'email' | 'inapp' | 'all';
  error?: string;
}

export interface PreferenciasNotificacion {
  userId: string;
  email: string;
  canales: {
    email: boolean;
    push: boolean;
    inapp: boolean;
  };
  tipos: {
    pago_recordatorio: boolean;
    pago_atraso: boolean;
    vencimiento: boolean;
    contrato_renovacion: boolean;
    pago_recibo: boolean;
    general: boolean;
  };
  diasAnticipacion: {
    pago: number; // días antes del pago
    vencimiento: number; // días antes del vencimiento
  };
  emailPersonalizado: {
    asunto?: string;
    mensaje?: string;
  };
}

export interface ConfiguracionNotificaciones {
  diasAnticipacionPago: number;
  diasAnticipacionVencimiento: number[];
  moraPorcentaje: number;
  emailTemplate: {
    asunto: string;
    cuerpo: string;
    firma: string;
  };
  pushTemplate: {
    titulo: string;
    mensaje: string;
  };
}

export interface NotificacionFiltros {
  destinatario?: string;
  tipo?: string;
  leida?: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  enviada?: boolean;
}

export interface StatsNotificaciones {
  total: number;
  leidas: number;
  noLeidas: number;
  porTipo: Record<string, number>;
  porCanal: Record<string, number>;
  tasaApertura: number;
}
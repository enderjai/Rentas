import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  and,
  or,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { 
  NOTIFICACION_COLECCION,
  PREFERENCIAS_COLECCION,
  CONFIGURACION_COLECCION,
  CONTRATO_COLECCION,
  INQUILINO_COLECCION,
  LOCAL_COLECCION,
  PAGO_COLECCION,
  USUARIOS_COLECCION
} from '../utils/constants';
import { 
  Notificacion, 
  PreferenciasNotificacion, 
  ConfiguracionNotificaciones,
  NotificacionFiltros,
  StatsNotificaciones
} from '../types/notificaciones';
import { format, addDays, differenceInDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export class NotificacionesService {
  // Obtener notificaciones con filtros
  static async getNotificaciones(filtros?: NotificacionFiltros): Promise<Notificacion[]> {
    const constraints = [];
    
    if (filtros?.destinatario) {
      constraints.push(where('destinatario', '==', filtros.destinatario));
    }
    
    if (filtros?.tipo) {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    if (filtros?.leida !== undefined) {
      constraints.push(where('leida', '==', filtros.leida));
    }
    
    if (filtros?.enviada !== undefined) {
      constraints.push(where('enviada', '==', filtros.enviada));
    }
    
    if (filtros?.fechaInicio && filtros?.fechaFin) {
      constraints.push(where('fecha', '>=', filtros.fechaInicio));
      constraints.push(where('fecha', '<=', filtros.fechaFin));
    }
    
    constraints.push(orderBy('fecha', 'desc'));
    
    return await FirestoreService.getAll<Notificacion>(NOTIFICACION_COLECCION, constraints);
  }

  // Obtener notificaciones no leídas de un usuario
  static async getNotificacionesNoLeidas(uid: string): Promise<Notificacion[]> {
    return await FirestoreService.getAll<Notificacion>(NOTIFICACION_COLECCION, [
      where('destinatario', '==', uid),
      where('leida', '==', false),
      orderBy('fecha', 'desc')
    ]);
  }

  // Marcar notificación como leída
  static async marcarComoLeida(id: string): Promise<void> {
    await FirestoreService.update(NOTIFICACION_COLECCION, id, {
      leida: true,
      fechaLectura: serverTimestamp()
    });
  }

  // Marcar todas las notificaciones como leídas
  static async marcarTodasComoLeidas(uid: string): Promise<void> {
    const notificaciones = await this.getNotificacionesNoLeidas(uid);
    const batch = writeBatch(db);
    
    notificaciones.forEach(notif => {
      const ref = doc(db, NOTIFICACION_COLECCION, notif.id);
      batch.update(ref, {
        leida: true,
        fechaLectura: serverTimestamp()
      });
    });
    
    await batch.commit();
  }

  // Crear notificación manual
  static async crearNotificacion(
    data: Omit<Notificacion, 'id' | 'fecha' | 'leida' | 'fechaLectura' | 'enviada' | 'fechaEnvio'>
  ): Promise<Notificacion> {
    // Verificar preferencias del usuario
    const preferencias = await this.getPreferencias(data.destinatario);
    
    if (!this.debeEnviarNotificacion(preferencias, data.tipo)) {
      // Si el usuario no quiere recibir este tipo de notificación, solo guardar en app
      return await FirestoreService.create<Notificacion>(NOTIFICACION_COLECCION, {
        ...data,
        leida: false,
        fecha: serverTimestamp(),
        fechaLectura: null,
        enviada: false,
        fechaEnvio: null,
        canal: 'inapp'
      });
    }

    // Determinar canales de envío
    const canal = preferencias.canales.email && preferencias.canales.push ? 'all' :
                  preferencias.canales.email ? 'email' :
                  preferencias.canales.push ? 'push' : 'inapp';

    const notificacion = await FirestoreService.create<Notificacion>(NOTIFICACION_COLECCION, {
      ...data,
      leida: false,
      fecha: serverTimestamp(),
      fechaLectura: null,
      enviada: false,
      fechaEnvio: null,
      canal
    });

    // Enviar notificación según canal
    await this.enviarNotificacion(notificacion, preferencias);

    return notificacion;
  }

  // Enviar notificación por canal apropiado
  static async enviarNotificacion(
    notificacion: Notificacion,
    preferencias: PreferenciasNotificacion
  ): Promise<void> {
    const { id, canal, tipo, destinatario, titulo, mensaje, datos } = notificacion;

    try {
      let enviada = false;

      // Enviar por email
      if (canal === 'email' || canal === 'all') {
        await this.enviarEmail({
          to: preferencias.email,
          subject: titulo,
          html: this.generarTemplateEmail(notificacion, preferencias),
          data: datos
        });
        enviada = true;
      }

      // Enviar por push
      if (canal === 'push' || canal === 'all') {
        await this.enviarPush({
          token: await this.getTokenPush(destinatario),
          title: titulo,
          body: mensaje,
          data: datos,
          icon: '/icon.png'
        });
        enviada = true;
      }

      // Enviar in-app (ya está guardada)
      if (canal === 'inapp') {
        enviada = true;
      }

      // Actualizar estado de envío
      await FirestoreService.update(NOTIFICACION_COLECCION, id, {
        enviada,
        fechaEnvio: serverTimestamp()
      });

    } catch (error) {
      console.error('Error al enviar notificación:', error);
      await FirestoreService.update(NOTIFICACION_COLECCION, id, {
        error: error.message,
        enviada: false
      });
    }
  }

  // Enviar email
  static async enviarEmail(data: {
    to: string;
    subject: string;
    html: string;
    data?: any;
  }): Promise<void> {
    // Implementación con SendGrid o Firebase Extensions
    // Por ahora, solo guardar en la base de datos
    console.log('📧 Enviando email:', data);
    
    // En producción, usar SendGrid API
    try {
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     personalizations: [{ to: [{ email: data.to }] }],
      //     from: { email: 'notificaciones@rentaspro.com' },
      //     subject: data.subject,
      //     content: [{ type: 'text/html', value: data.html }]
      //   })
      // });
      // 
      // if (!response.ok) throw new Error('Error al enviar email');
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Enviar push notification
  static async enviarPush(data: {
    token: string;
    title: string;
    body: string;
    data?: any;
    icon?: string;
  }): Promise<void> {
    // Implementación con Firebase Cloud Messaging
    console.log('🔔 Enviando push notification:', data);
    
    // En producción, usar FCM
    try {
      // const message = {
      //   notification: {
      //     title: data.title,
      //     body: data.body
      //   },
      //   data: data.data,
      //   token: data.token
      // };
      // 
      // await admin.messaging().send(message);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Obtener preferencias del usuario
  static async getPreferencias(uid: string): Promise<PreferenciasNotificacion> {
    const preferencias = await FirestoreService.getById<PreferenciasNotificacion>(
      PREFERENCIAS_COLECCION,
      uid
    );
    
    if (!preferencias) {
      // Crear preferencias por defecto
      const defaultPreferencias: PreferenciasNotificacion = {
        userId: uid,
        email: '',
        canales: {
          email: true,
          push: true,
          inapp: true
        },
        tipos: {
          pago_recordatorio: true,
          pago_atraso: true,
          vencimiento: true,
          contrato_renovacion: true,
          pago_recibo: true,
          general: true
        },
        diasAnticipacion: {
          pago: 3,
          vencimiento: 30
        }
      };
      
      await FirestoreService.create(PREFERENCIAS_COLECCION, defaultPreferencias);
      return defaultPreferencias;
    }
    
    return preferencias;
  }

  // Actualizar preferencias
  static async updatePreferencias(
    uid: string,
    data: Partial<PreferenciasNotificacion>
  ): Promise<void> {
    await FirestoreService.update(PREFERENCIAS_COLECCION, uid, data);
  }

  // Verificar si debe enviar notificación según preferencias
  static debeEnviarNotificacion(
    preferencias: PreferenciasNotificacion,
    tipo: string
  ): boolean {
    return preferencias.tipos[tipo as keyof typeof preferencias.tipos] !== false;
  }

  // Generar template de email
  static generarTemplateEmail(
    notificacion: Notificacion,
    preferencias: PreferenciasNotificacion
  ): string {
    const config = this.getConfiguracion();
    const tipoLabel = TIPOS_NOTIFICACION.find(t => t.value === notificacion.tipo)?.label || '';
    
    let contenidoExtra = '';
    if (notificacion.datos) {
      const { monto, diasAtraso, fechaVencimiento } = notificacion.datos;
      if (monto) contenidoExtra += `<p><strong>Monto:</strong> $${monto.toLocaleString()}</p>`;
      if (diasAtraso) contenidoExtra += `<p><strong>Días de atraso:</strong> ${diasAtraso}</p>`;
      if (fechaVencimiento) {
        contenidoExtra += `<p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>`;
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificacion.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .badge { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: #1e40af;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RentasPro</h1>
            <p>Sistema de Gestión de Rentas</p>
          </div>
          <div class="content">
            <p><span class="badge">${tipoLabel}</span></p>
            <h2>${notificacion.titulo}</h2>
            <p>${notificacion.mensaje}</p>
            ${contenidoExtra}
            ${notificacion.enlace ? `<a href="${notificacion.enlace}" class="button">Ver Detalles</a>` : ''}
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              ${config.emailTemplate.firma || 'Este es un mensaje automático del sistema de RentasPro.'}
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RentasPro - Todos los derechos reservados</p>
            <p>Si no deseas recibir estas notificaciones, ajusta tus preferencias en el sistema.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Obtener configuración del sistema
  static getConfiguracion(): ConfiguracionNotificaciones {
    // En producción, obtener de Firestore
    return {
      diasAnticipacionPago: 3,
      diasAnticipacionVencimiento: [30, 15, 7],
      moraPorcentaje: 2,
      emailTemplate: {
        asunto: 'Notificación de RentasPro',
        cuerpo: 'Estimado usuario,',
        firma: 'Atentamente, el equipo de RentasPro'
      },
      pushTemplate: {
        titulo: 'Nueva notificación',
        mensaje: 'Tienes una nueva notificación en RentasPro'
      }
    };
  }

  // Obtener token push del usuario
  static async getTokenPush(uid: string): Promise<string> {
    // En producción, obtener de Firestore
    const userDoc = await FirestoreService.getById<any>(USUARIOS_COLECCION, uid);
    return userDoc?.pushToken || '';
  }

  // Generar notificaciones automáticas
  static async generarNotificacionesAutomaticas(): Promise<void> {
    await this.generarRecordatoriosPago();
    await this.generarAvisosAtraso();
    await this.generarRecordatoriosVencimiento();
  }

  // Generar recordatorios de pago
  static async generarRecordatoriosPago(): Promise<void> {
    const config = this.getConfiguracion();
    const hoy = new Date();
    const fechaLimite = addDays(hoy, config.diasAnticipacionPago);

    // Obtener contratos vigentes
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    for (const contrato of contratos) {
      const diaPago = contrato.diaPago || 1;
      const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
      
      // Si el día de pago cae en los próximos días
      const diasRestantes = differenceInDays(fechaPago, hoy);
      if (diasRestantes === config.diasAnticipacionPago) {
        const inquilino = await FirestoreService.getById<any>(
          INQUILINO_COLECCION,
          contrato.inquilinoId
        );
        const local = await FirestoreService.getById<any>(
          LOCAL_COLECCION,
          contrato.localId
        );

        if (inquilino?.userId) {
          await this.crearNotificacion({
            destinatario: inquilino.userId,
            destinatarioEmail: inquilino.email,
            tipo: 'pago_recordatorio',
            titulo: 'Recordatorio de Pago',
            mensaje: `El pago de renta del local ${local?.nombre || 'su local'} vence en ${diasRestantes} días. Monto: $${contrato.montoRenta.toLocaleString()}`,
            datos: {
              contratoId: contrato.id,
              localId: contrato.localId,
              inquilinoId: contrato.inquilinoId,
              monto: contrato.montoRenta,
              fechaVencimiento: format(fechaPago, 'dd/MM/yyyy', { locale: es })
            },
            enlace: `/pagos/registrar?contrato=${contrato.id}`,
            canal: 'all'
          });
        }
      }
    }
  }

  // Generar avisos de atraso
  static async generarAvisosAtraso(): Promise<void> {
    const hoy = new Date();
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    for (const contrato of contratos) {
      const mesActual = format(hoy, 'yyyy-MM');
      
      // Verificar si ya pagó el mes
      const pagos = await FirestoreService.getAll<any>(PAGO_COLECCION, [
        where('contratoId', '==', contrato.id),
        where('mesCorrespondiente', '==', mesActual)
      ]);

      if (pagos.length === 0) {
        const diaPago = contrato.diaPago || 1;
        const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
        const diasAtraso = differenceInDays(hoy, fechaPago);

        // Si tiene 1 día de atraso
        if (diasAtraso === 1) {
          const inquilino = await FirestoreService.getById<any>(
            INQUILINO_COLECCION,
            contrato.inquilinoId
          );
          const local = await FirestoreService.getById<any>(
            LOCAL_COLECCION,
            contrato.localId
          );

          if (inquilino?.userId) {
            await this.crearNotificacion({
              destinatario: inquilino.userId,
              destinatarioEmail: inquilino.email,
              tipo: 'pago_atraso',
              titulo: '⚠️ Aviso de Atraso',
              mensaje: `Tu pago de renta del local ${local?.nombre || 'su local'} tiene 1 día de atraso. Favor de regularizar a la brevedad.`,
              datos: {
                contratoId: contrato.id,
                localId: contrato.localId,
                inquilinoId: contrato.inquilinoId,
                monto: contrato.montoRenta,
                diasAtraso,
                fechaVencimiento: format(fechaPago, 'dd/MM/yyyy', { locale: es })
              },
              enlace: `/pagos/registrar?contrato=${contrato.id}`,
              canal: 'all'
            });
          }

          // Notificar también a los cobradores
          const cobradores = await FirestoreService.getAll<any>(USUARIOS_COLECCION, [
            where('rol', '==', 'cobrador')
          ]);

          for (const cobrador of cobradores) {
            await this.crearNotificacion({
              destinatario: cobrador.uid,
              destinatarioEmail: cobrador.email,
              tipo: 'pago_atraso',
              titulo: '⚠️ Atraso de Pago',
              mensaje: `El inquilino ${inquilino?.nombre || 'desconocido'} del local ${local?.nombre || 'desconocido'} tiene 1 día de atraso en su pago.`,
              datos: {
                contratoId: contrato.id,
                localId: contrato.localId,
                inquilinoId: contrato.inquilinoId,
                monto: contrato.montoRenta,
                diasAtraso
              },
              enlace: `/contratos/${contrato.id}`,
              canal: 'all'
            });
          }
        }
      }
    }
  }

  // Generar recordatorios de vencimiento de contrato
  static async generarRecordatoriosVencimiento(): Promise<void> {
    const config = this.getConfiguracion();
    const hoy = new Date();

    for (const dias of config.diasAnticipacionVencimiento) {
      const fechaLimite = addDays(hoy, dias);
      
      const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
        where('estado', '==', 'vigente'),
        where('fechaFin', '>=', hoy),
        where('fechaFin', '<=', fechaLimite)
      ]);

      for (const contrato of contratos) {
        const fechaFin = contrato.fechaFin.toDate();
        const diasRestantes = differenceInDays(fechaFin, hoy);

        if (diasRestantes === dias) {
          const local = await FirestoreService.getById<any>(
            LOCAL_COLECCION,
            contrato.localId
          );

          // Notificar a los administradores
          const admins = await FirestoreService.getAll<any>(USUARIOS_COLECCION, [
            where('rol', '==', 'admin')
          ]);

          for (const admin of admins) {
            await this.crearNotificacion({
              destinatario: admin.uid,
              destinatarioEmail: admin.email,
              tipo: 'vencimiento',
              titulo: '📅 Vencimiento de Contrato',
              mensaje: `El contrato del local ${local?.nombre || 'desconocido'} vence en ${dias} días.`,
              datos: {
                contratoId: contrato.id,
                localId: contrato.localId,
                inquilinoId: contrato.inquilinoId,
                fechaVencimiento: format(fechaFin, 'dd/MM/yyyy', { locale: es })
              },
              enlace: `/contratos/${contrato.id}`,
              canal: 'all'
            });
          }
        }
      }
    }
  }

  // Generar recibo de pago
  static async generarReciboPago(pagoId: string): Promise<void> {
    const pago = await FirestoreService.getById<any>(PAGO_COLECCION, pagoId);
    if (!pago) return;

    const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, pago.contratoId);
    const inquilino = await FirestoreService.getById<any>(INQUILINO_COLECCION, pago.inquilinoId);
    const local = await FirestoreService.getById<any>(LOCAL_COLECCION, pago.localId);

    if (inquilino?.userId) {
      await this.crearNotificacion({
        destinatario: inquilino.userId,
        destinatarioEmail: inquilino.email,
        tipo: 'pago_recibo',
        titulo: '📄 Recibo de Pago',
        mensaje: `Se ha registrado tu pago de renta del mes ${pago.mesCorrespondiente} para el local ${local?.nombre || 'tu local'}. Monto: $${pago.monto.toLocaleString()}`,
        datos: {
          pagoId,
          contratoId: contrato.id,
          localId: pago.localId,
          inquilinoId: pago.inquilinoId,
          monto: pago.monto,
          mes: pago.mesCorrespondiente
        },
        enlace: `/pagos/${pagoId}`,
        canal: 'all'
      });
    }
  }

  // Enviar notificación manual a morosos
  static async enviarNotificacionMorosos(mensaje: string): Promise<void> {
    const morosos = await this.getMorosos();
    
    for (const moroso of morosos) {
      if (moroso.userId) {
        await this.crearNotificacion({
          destinatario: moroso.userId,
          destinatarioEmail: moroso.email,
          tipo: 'general',
          titulo: '📢 Aviso de Morosidad',
          mensaje,
          datos: {
            inquilinoId: moroso.id,
            localId: moroso.localActual
          },
          enlace: `/pagos/registrar`,
          canal: 'all'
        });
      }
    }
  }

  // Obtener estadísticas de notificaciones
  static async getStats(uid?: string): Promise<StatsNotificaciones> {
    let notificaciones = [];
    
    if (uid) {
      notificaciones = await this.getNotificaciones({ destinatario: uid });
    } else {
      notificaciones = await this.getNotificaciones();
    }

    const leidas = notificaciones.filter(n => n.leida).length;
    const noLeidas = notificaciones.length - leidas;
    
    const porTipo: Record<string, number> = {};
    const porCanal: Record<string, number> = {};
    
    notificaciones.forEach(n => {
      porTipo[n.tipo] = (porTipo[n.tipo] || 0) + 1;
      if (n.canal) {
        porCanal[n.canal] = (porCanal[n.canal] || 0) + 1;
      }
    });

    return {
      total: notificaciones.length,
      leidas,
      noLeidas,
      porTipo,
      porCanal,
      tasaApertura: notificaciones.length > 0 ? (leidas / notificaciones.length) * 100 : 0
    };
  }

  // Obtener morosos para notificaciones
  static async getMorosos(): Promise<any[]> {
    // Implementación simplificada
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    const morosos = [];
    const hoy = new Date();
    const mesActual = format(hoy, 'yyyy-MM');

    for (const contrato of contratos) {
      const pagos = await FirestoreService.getAll<any>(PAGO_COLECCION, [
        where('contratoId', '==', contrato.id),
        where('mesCorrespondiente', '==', mesActual)
      ]);

      if (pagos.length === 0) {
        const inquilino = await FirestoreService.getById<any>(
          INQUILINO_COLECCION,
          contrato.inquilinoId
        );
        if (inquilino) {
          morosos.push({
            ...inquilino,
            contratoId: contrato.id,
            localId: contrato.localId
          });
        }
      }
    }

    return morosos;
  }
}
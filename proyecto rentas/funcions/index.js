const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { format, addDays, differenceInDays } = require('date-fns');
const { es } = require('date-fns/locale');

admin.initializeApp();

// ============================================
// 1. PROGRAMAR NOTIFICACIONES AL CREAR CONTRATO
// ============================================
exports.onContractCreate = functions.firestore
  .document('contratos/{contratoId}')
  .onCreate(async (snap, context) => {
    const contrato = snap.data();
    const config = await getConfiguracion();
    
    // Programar recordatorios de vencimiento
    const diasAnticipacion = config.diasAnticipacionVencimiento || [30, 15, 7];
    
    for (const dias of diasAnticipacion) {
      const fechaProgramada = addDays(contrato.fechaFin.toDate(), -dias);
      
      // Guardar programación en Firestore
      await admin.firestore().collection('programaciones').add({
        contratoId: context.params.contratoId,
        tipo: 'vencimiento',
        diasAntes: dias,
        fechaProgramada,
        ejecutado: false,
        creado: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`✅ Programadas ${diasAnticipacion.length} notificaciones de vencimiento`);
  });

// ============================================
// 2. ENVIAR RECIBO AL CREAR PAGO
// ============================================
exports.onPaymentCreate = functions.firestore
  .document('pagos/{pagoId}')
  .onCreate(async (snap, context) => {
    const pago = snap.data();
    
    // Obtener datos relacionados
    const contrato = await admin.firestore()
      .collection('contratos')
      .doc(pago.contratoId)
      .get();
    
    const inquilino = await admin.firestore()
      .collection('inquilinos')
      .doc(pago.inquilinoId)
      .get();
    
    const local = await admin.firestore()
      .collection('locales')
      .doc(pago.localId)
      .get();
    
    // Enviar notificación de recibo
    if (inquilino.exists && inquilino.data().userId) {
      await crearNotificacion({
        destinatario: inquilino.data().userId,
        destinatarioEmail: inquilino.data().email,
        tipo: 'pago_recibo',
        titulo: '📄 Recibo de Pago',
        mensaje: `Se ha registrado tu pago de renta del mes ${pago.mesCorrespondiente} para el local ${local.data()?.nombre || 'tu local'}. Monto: $${pago.monto.toLocaleString()}`,
        datos: {
          pagoId: context.params.pagoId,
          contratoId: pago.contratoId,
          monto: pago.monto,
          mes: pago.mesCorrespondiente
        },
        enlace: `/pagos/${context.params.pagoId}`
      });
    }
    
    console.log(`✅ Recibo de pago enviado para ${pagoId}`);
  });

// ============================================
// 3. VERIFICAR PAGOS DIARIAMENTE
// ============================================
exports.checkPayments = functions.pubsub
  .schedule('0 9 * * *')
  .onRun(async (context) => {
    const hoy = new Date();
    const mesActual = format(hoy, 'yyyy-MM');
    const config = await getConfiguracion();
    const diasAnticipacion = config.diasAnticipacionPago || 3;
    
    // Obtener contratos vigentes
    const contratosSnapshot = await admin.firestore()
      .collection('contratos')
      .where('estado', '==', 'vigente')
      .get();
    
    for (const doc of contratosSnapshot.docs) {
      const contrato = doc.data();
      const diaPago = contrato.diaPago || 1;
      const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
      
      // Verificar pagos del mes
      const pagosSnapshot = await admin.firestore()
        .collection('pagos')
        .where('contratoId', '==', doc.id)
        .where('mesCorrespondiente', '==', mesActual)
        .get();
      
      const pagoRealizado = !pagosSnapshot.empty;
      
      // Si ya pagó, continuar
      if (pagoRealizado) continue;
      
      // Calcular días
      const diasRestantes = differenceInDays(fechaPago, hoy);
      const diasAtraso = differenceInDays(hoy, fechaPago);
      
      // Recordatorio de pago (días antes)
      if (diasRestantes === diasAnticipacion) {
        const inquilino = await admin.firestore()
          .collection('inquilinos')
          .doc(contrato.inquilinoId)
          .get();
        
        const local = await admin.firestore()
          .collection('locales')
          .doc(contrato.localId)
          .get();
        
        if (inquilino.exists && inquilino.data().userId) {
          await crearNotificacion({
            destinatario: inquilino.data().userId,
            destinatarioEmail: inquilino.data().email,
            tipo: 'pago_recordatorio',
            titulo: '💳 Recordatorio de Pago',
            mensaje: `El pago de renta del mes ${mesActual} vence en ${diasRestantes} días. Monto: $${contrato.montoRenta.toLocaleString()}`,
            datos: {
              contratoId: doc.id,
              monto: contrato.montoRenta,
              fechaVencimiento: format(fechaPago, 'dd/MM/yyyy', { locale: es })
            },
            enlace: `/pagos/registrar?contrato=${doc.id}`
          });
        }
      }
      
      // Aviso de atraso (1 día después)
      if (diasAtraso === 1) {
        const inquilino = await admin.firestore()
          .collection('inquilinos')
          .doc(contrato.inquilinoId)
          .get();
        
        const local = await admin.firestore()
          .collection('locales')
          .doc(contrato.localId)
          .get();
        
        if (inquilino.exists && inquilino.data().userId) {
          await crearNotificacion({
            destinatario: inquilino.data().userId,
            destinatarioEmail: inquilino.data().email,
            tipo: 'pago_atraso',
            titulo: '⚠️ Aviso de Atraso',
            mensaje: `Tu pago de renta del mes ${mesActual} tiene 1 día de atraso. Favor de regularizar a la brevedad.`,
            datos: {
              contratoId: doc.id,
              monto: contrato.montoRenta,
              diasAtraso
            },
            enlace: `/pagos/registrar?contrato=${doc.id}`
          });
        }
      }
    }
    
    console.log(`✅ Verificación de pagos completada`);
  });

// ============================================
// 4. VERIFICAR CONTRATOS VENCIDOS
// ============================================
exports.checkContractExpiration = functions.pubsub
  .schedule('0 1 * * *')
  .onRun(async (context) => {
    const hoy = new Date();
    
    const contratosSnapshot = await admin.firestore()
      .collection('contratos')
      .where('estado', '==', 'vigente')
      .where('fechaFin', '<', hoy)
      .get();
    
    const batch = admin.firestore().batch();
    
    for (const doc of contratosSnapshot.docs) {
      const contrato = doc.data();
      
      // Marcar contrato como vencido
      batch.update(doc.ref, {
        estado: 'vencido',
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Actualizar local a disponible
      const localRef = admin.firestore().collection('locales').doc(contrato.localId);
      batch.update(localRef, {
        estado: 'disponible',
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notificar administradores
      const adminsSnapshot = await admin.firestore()
        .collection('usuarios')
        .where('rol', '==', 'admin')
        .get();
      
      for (const adminDoc of adminsSnapshot.docs) {
        await crearNotificacion({
          destinatario: adminDoc.id,
          destinatarioEmail: adminDoc.data().email,
          tipo: 'vencimiento',
          titulo: '📅 Contrato Vencido',
          mensaje: `El contrato del local ${contrato.localId} ha vencido automáticamente.`,
          datos: {
            contratoId: doc.id,
            localId: contrato.localId
          },
          enlace: `/contratos/${doc.id}`
        });
      }
    }
    
    await batch.commit();
    console.log(`✅ ${contratosSnapshot.size} contratos marcados como vencidos`);
  });

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Crear notificación
async function crearNotificacion(data) {
  const notificacion = {
    ...data,
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    fechaLectura: null,
    enviada: true,
    fechaEnvio: admin.firestore.FieldValue.serverTimestamp(),
    canal: 'all'
  };
  
  await admin.firestore().collection('notificaciones').add(notificacion);
  return notificacion;
}

// Obtener configuración
async function getConfiguracion() {
  const configSnapshot = await admin.firestore()
    .collection('configuracion')
    .doc('notificaciones')
    .get();
  
  if (configSnapshot.exists) {
    return configSnapshot.data();
  }
  
  // Configuración por defecto
  return {
    diasAnticipacionPago: 3,
    diasAnticipacionVencimiento: [30, 15, 7],
    moraPorcentaje: 2
  };
}
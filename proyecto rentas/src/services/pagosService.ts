import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  and,
  or,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { 
  PAGO_COLECCION, 
  CONTRATO_COLECCION,
  INQUILINO_COLECCION,
  LOCAL_COLECCION,
  CONFIGURACION_COLECCION
} from '../utils/constants';
import { 
  Pago, 
  PagoFormData, 
  PagoFilters, 
  EstadoPago, 
  DeudaTotal,
  ConfiguracionMorosidad 
} from '../types/pago';
import { format, subMonths, addMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RECIBO_CONFIG } from '../utils/constants';

export class PagosService {
  // Obtener todos los pagos con filtros
  static async getPagos(filtros?: PagoFilters): Promise<Pago[]> {
    const constraints = [];
    
    if (filtros?.contratoId) {
      constraints.push(where('contratoId', '==', filtros.contratoId));
    }
    
    if (filtros?.inquilinoId) {
      constraints.push(where('inquilinoId', '==', filtros.inquilinoId));
    }
    
    if (filtros?.localId) {
      constraints.push(where('localId', '==', filtros.localId));
    }
    
    if (filtros?.mes) {
      constraints.push(where('mesCorrespondiente', '==', filtros.mes));
    }
    
    if (filtros?.metodo) {
      constraints.push(where('metodo', '==', filtros.metodo));
    }
    
    if (filtros?.fechaInicio && filtros?.fechaFin) {
      constraints.push(where('fechaPago', '>=', filtros.fechaInicio));
      constraints.push(where('fechaPago', '<=', filtros.fechaFin));
    }
    
    constraints.push(orderBy('fechaPago', 'desc'));
    
    const pagos = await FirestoreService.getAll<Pago>(PAGO_COLECCION, constraints);
    
    // Enriquecer con nombres
    await this.enriquecerPagos(pagos);
    
    return pagos;
  }

  // Obtener un pago por ID
  static async getPagoById(id: string): Promise<Pago | null> {
    const pago = await FirestoreService.getById<Pago>(PAGO_COLECCION, id);
    if (pago) {
      const enriquecidos = await this.enriquecerPagos([pago]);
      return enriquecidos[0];
    }
    return null;
  }

  // Enriquecer pagos con información de contrato, local e inquilino
  static async enriquecerPagos(pagos: Pago[]): Promise<Pago[]> {
    for (const pago of pagos) {
      // Obtener local
      if (pago.localId) {
        const local = await FirestoreService.getById<any>(LOCAL_COLECCION, pago.localId);
        if (local) {
          pago.localNombre = local.nombre;
        }
      }
      
      // Obtener inquilino
      if (pago.inquilinoId) {
        const inquilino = await FirestoreService.getById<any>(INQUILINO_COLECCION, pago.inquilinoId);
        if (inquilino) {
          pago.inquilinoNombre = inquilino.nombre;
        }
      }
    }
    return pagos;
  }

  // Registrar un nuevo pago
  static async registrarPago(
    data: PagoFormData,
    registradoPor: string
  ): Promise<{ success: boolean; pago?: Pago; error?: string }> {
    try {
      // Validar que el contrato exista y esté vigente
      const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, data.contratoId);
      if (!contrato) {
        return { success: false, error: 'Contrato no encontrado' };
      }

      // Validar que no exista pago para el mismo mes
      const pagoExistente = await this.verificarPagoMes(data.contratoId, data.mesCorrespondiente);
      if (pagoExistente) {
        return { 
          success: false, 
          error: `Ya existe un pago registrado para el mes ${data.mesCorrespondiente}` 
        };
      }

      // Validar que el monto sea correcto
      if (data.monto <= 0) {
        return { success: false, error: 'El monto debe ser mayor a 0' };
      }

      // Crear el pago
      const pagoData = {
        ...data,
        fechaRegistro: serverTimestamp(),
        registradoPor,
        numeroRecibo: await this.generarNumeroRecibo()
      };

      const pago = await FirestoreService.create<Pago>(PAGO_COLECCION, pagoData);

      // Generar recibo PDF automáticamente
      const pdfUrl = await this.generarReciboPDF(pago.id);
      if (pdfUrl) {
        await FirestoreService.update(PAGO_COLECCION, pago.id, {
          comprobante: pdfUrl,
          fechaActualizacion: serverTimestamp()
        });
        pago.comprobante = pdfUrl;
      }

      return { success: true, pago };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al registrar el pago' 
      };
    }
  }

  // Verificar si ya existe pago para un mes específico
  static async verificarPagoMes(contratoId: string, mes: string): Promise<boolean> {
    const q = query(
      collection(db, PAGO_COLECCION),
      where('contratoId', '==', contratoId),
      where('mesCorrespondiente', '==', mes)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Generar número de recibo automático
  static async generarNumeroRecibo(): Promise<string> {
    const año = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const q = query(
      collection(db, PAGO_COLECCION),
      where('fechaRegistro', '>=', new Date(año, 0, 1)),
      orderBy('fechaRegistro', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    let consecutivo = 1;
    
    if (!snapshot.empty) {
      const ultimoPago = snapshot.docs[0].data();
      if (ultimoPago.numeroRecibo) {
        const partes = ultimoPago.numeroRecibo.split('-');
        if (partes.length === 3) {
          consecutivo = parseInt(partes[2]) + 1;
        }
      }
    }
    
    return `REC-${año}${mes}-${String(consecutivo).padStart(4, '0')}`;
  }

  // Generar recibo PDF
  static async generarReciboPDF(pagoId: string): Promise<string | null> {
    try {
      const pago = await this.getPagoById(pagoId);
      if (!pago) return null;

      const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, pago.contratoId);
      const local = await FirestoreService.getById<any>(LOCAL_COLECCION, pago.localId);
      const inquilino = await FirestoreService.getById<any>(INQUILINO_COLECCION, pago.inquilinoId);

      // Crear PDF
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4'
      });

      // Logo (opcional)
      if (RECIBO_CONFIG.logo) {
        try {
          doc.addImage(RECIBO_CONFIG.logo, 'JPEG', 20, 15, 30, 20);
        } catch (error) {
          console.warn('Error al cargar logo:', error);
        }
      }

      // Encabezado
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(RECIBO_CONFIG.empresa, 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Recibo de Pago de Renta', 105, 40, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(RECIBO_CONFIG.direccion, 105, 48, { align: 'center' });
      doc.text(`Tel: ${RECIBO_CONFIG.telefono}`, 105, 54, { align: 'center' });
      doc.text(`Email: ${RECIBO_CONFIG.email}`, 105, 60, { align: 'center' });

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(20, 68, 190, 68);

      // Número de recibo
      doc.setFontSize(11);
      doc.text(`Número de Recibo: ${pago.numeroRecibo || 'No asignado'}`, 20, 78);
      doc.text(`Fecha: ${format(new Date(pago.fechaPago), 'dd/MM/yyyy HH:mm', { locale: es })}`, 140, 78);

      // Datos del contrato
      doc.setFontSize(12);
      doc.text('DATOS DEL CONTRATO', 20, 92);
      doc.setFontSize(10);
      doc.text(`Local: ${local?.nombre || 'No especificado'}`, 25, 100);
      doc.text(`Dirección: ${local?.direccion || 'No especificada'}`, 25, 107);
      doc.text(`Inquilino: ${inquilino?.nombre || 'No especificado'}`, 25, 114);
      doc.text(`Período: ${contrato?.fechaInicio ? format(new Date(contrato.fechaInicio), 'dd/MM/yyyy', { locale: es }) : 'N/A'} - ${contrato?.fechaFin ? format(new Date(contrato.fechaFin), 'dd/MM/yyyy', { locale: es }) : 'N/A'}`, 25, 121);

      // Tabla de detalles del pago
      const tableData = [
        ['Concepto', 'Mes Correspondiente', 'Monto', 'Método de Pago'],
        [
          `Renta ${local?.nombre || ''}`,
          pago.mesCorrespondiente || 'N/A',
          `$${pago.monto.toLocaleString()}`,
          pago.metodo || 'N/A'
        ]
      ];

      autoTable(doc, {
        startY: 135,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        columnStyles: {
          2: { halign: 'right' }
        }
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY || 170;
      doc.setFontSize(12);
      doc.text(`Total Pagado: $${pago.monto.toLocaleString()}`, 150, finalY + 10);

      // Observaciones
      if (pago.observaciones) {
        doc.setFontSize(10);
        doc.text('Observaciones:', 20, finalY + 25);
        doc.text(pago.observaciones, 25, finalY + 33);
      }

      // Pie de página
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Este recibo es un comprobante de pago válido', 105, 280, { align: 'center' });
      doc.text(`Generado automáticamente por ${RECIBO_CONFIG.empresa}`, 105, 286, { align: 'center' });

      // Guardar PDF
      const pdfOutput = doc.output('blob');
      const path = `recibos/${pagoId}/recibo_${pago.numeroRecibo || Date.now()}.pdf`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, pdfOutput);
      const url = await getDownloadURL(storageRef);
      
      return url;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      return null;
    }
  }

  // Calcular estado de pago para un contrato y mes específico
  static async getEstadoPago(contratoId: string, mes: string): Promise<EstadoPago> {
    const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, contratoId);
    if (!contrato) {
      throw new Error('Contrato no encontrado');
    }

    const [year, month] = mes.split('-').map(Number);
    const fechaEsperada = new Date(year, month - 1, contrato.diaPago || 1);

    // Obtener pagos del mes
    const pagos = await this.getPagos({ contratoId, mes });
    
    if (pagos.length > 0) {
      return {
        contratoId,
        mes,
        estado: 'pagado',
        diasAtraso: 0,
        montoAdeudado: 0,
        fechaEsperada,
        pagosRealizados: pagos
      };
    }

    // Calcular días de atraso
    const hoy = new Date();
    const diasAtraso = differenceInDays(hoy, fechaEsperada);

    return {
      contratoId,
      mes,
      estado: diasAtraso > 0 ? 'atrasado' : 'pendiente',
      diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
      montoAdeudado: diasAtraso > 0 ? contrato.montoRenta : 0,
      fechaEsperada,
      pagosRealizados: []
    };
  }

  // Calcular deuda total de un contrato
  static async getDeudaTotal(contratoId: string): Promise<DeudaTotal> {
    const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, contratoId);
    if (!contrato) {
      throw new Error('Contrato no encontrado');
    }

    const hoy = new Date();
    const fechaInicio = new Date(contrato.fechaInicio);
    const mesesAdeudados = [];
    const pagosRealizados = await this.getPagos({ contratoId });

    // Obtener meses desde inicio del contrato hasta hoy
    let mesIter = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    while (mesIter <= mesActual) {
      const mesStr = format(mesIter, 'yyyy-MM');
      const tienePago = pagosRealizados.some(p => p.mesCorrespondiente === mesStr);
      
      if (!tienePago) {
        mesesAdeudados.push(mesStr);
      }
      
      mesIter = addMonths(mesIter, 1);
    }

    const totalAdeudado = mesesAdeudados.length * contrato.montoRenta;

    return {
      contratoId,
      totalAdeudado,
      mesesAdeudados: mesesAdeudados.length,
      primerMesAdeudado: mesesAdeudados[0] || '',
      ultimoMesAdeudado: mesesAdeudados[mesesAdeudados.length - 1] || '',
      pagosRealizados
    };
  }

  // Obtener morosos (contratos con pagos atrasados)
  static async getMorosos(): Promise<{
    contratoId: string;
    inquilinoId: string;
    localId: string;
    inquilinoNombre: string;
    localNombre: string;
    diasAtraso: number;
    montoAdeudado: number;
    mesesAdeudados: number;
    ultimoPago?: Date;
  }[]> {
    const contratosVigentes = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    const morosos = [];

    for (const contrato of contratosVigentes) {
      const deuda = await this.getDeudaTotal(contrato.id);
      
      if (deuda.mesesAdeudados > 0) {
        const estadoMesActual = await this.getEstadoPago(
          contrato.id,
          format(new Date(), 'yyyy-MM')
        );
        
        const inquilino = await FirestoreService.getById<any>(
          INQUILINO_COLECCION,
          contrato.inquilinoId
        );
        
        const local = await FirestoreService.getById<any>(
          LOCAL_COLECCION,
          contrato.localId
        );

        morosos.push({
          contratoId: contrato.id,
          inquilinoId: contrato.inquilinoId,
          localId: contrato.localId,
          inquilinoNombre: inquilino?.nombre || 'Desconocido',
          localNombre: local?.nombre || 'Desconocido',
          diasAtraso: estadoMesActual.diasAtraso,
          montoAdeudado: deuda.totalAdeudado,
          mesesAdeudados: deuda.mesesAdeudados,
          ultimoPago: deuda.pagosRealizados[0]?.fechaPago
        });
      }
    }

    return morosos.sort((a, b) => b.diasAtraso - a.diasAtraso);
  }

  // Enviar recordatorio de pago
  static async enviarRecordatorioPago(
    contratoId: string,
    tipo: 'recordatorio' | 'atraso'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const contrato = await FirestoreService.getById<any>(CONTRATO_COLECCION, contratoId);
      if (!contrato) {
        return { success: false, error: 'Contrato no encontrado' };
      }

      const inquilino = await FirestoreService.getById<any>(
        INQUILINO_COLECCION,
        contrato.inquilinoId
      );
      
      const local = await FirestoreService.getById<any>(
        LOCAL_COLECCION,
        contrato.localId
      );

      // Crear mensaje según tipo
      let mensaje = '';
      const mes = format(new Date(), 'MMMM', { locale: es });
      
      if (tipo === 'recordatorio') {
        mensaje = `📢 Recordatorio: El pago de renta del mes de ${mes} para el local ${local?.nombre || 'su local'} está próximo. Monto: $${contrato.montoRenta.toLocaleString()}`;
      } else {
        const estado = await this.getEstadoPago(contratoId, format(new Date(), 'yyyy-MM'));
        mensaje = `⚠️ Aviso de atraso: El pago de renta del mes de ${mes} para el local ${local?.nombre || 'su local'} tiene ${estado.diasAtraso} días de retraso. Monto: $${contrato.montoRenta.toLocaleString()}`;
      }

      // Guardar notificación en Firestore
      await FirestoreService.create('notificaciones', {
        destinatario: inquilino?.userId || 'admin',
        mensaje,
        tipo: tipo === 'recordatorio' ? 'recordatorio_pago' : 'atraso_pago',
        contratoId,
        fecha: serverTimestamp(),
        leida: false
      });

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al enviar recordatorio' 
      };
    }
  }

  // Escuchar pagos en tiempo real
  static listenToPagos(
    callback: (pagos: Pago[]) => void,
    filtros?: PagoFilters
  ) {
    const constraints = [];
    
    if (filtros?.contratoId) {
      constraints.push(where('contratoId', '==', filtros.contratoId));
    }
    
    if (filtros?.inquilinoId) {
      constraints.push(where('inquilinoId', '==', filtros.inquilinoId));
    }
    
    if (filtros?.localId) {
      constraints.push(where('localId', '==', filtros.localId));
    }
    
    if (filtros?.mes) {
      constraints.push(where('mesCorrespondiente', '==', filtros.mes));
    }
    
    constraints.push(orderBy('fechaPago', 'desc'));
    
    return FirestoreService.listenToCollection<Pago>(
      PAGO_COLECCION,
      async (pagos) => {
        await this.enriquecerPagos(pagos);
        callback(pagos);
      },
      constraints
    );
  }

  // Obtener estadísticas de pagos
  static async getEstadisticas(filtros?: {
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<{
    totalPagos: number;
    totalMonto: number;
    promedioMonto: number;
    pagosPorMetodo: Record<string, number>;
    pagosPorMes: Record<string, number>;
  }> {
    const pagos = await this.getPagos(filtros);
    
    const totalMonto = pagos.reduce((sum, p) => sum + p.monto, 0);
    const pagosPorMetodo: Record<string, number> = {};
    const pagosPorMes: Record<string, number> = {};
    
    pagos.forEach(p => {
      // Por método
      pagosPorMetodo[p.metodo] = (pagosPorMetodo[p.metodo] || 0) + 1;
      
      // Por mes
      const mes = p.mesCorrespondiente;
      pagosPorMes[mes] = (pagosPorMes[mes] || 0) + 1;
    });
    
    return {
      totalPagos: pagos.length,
      totalMonto,
      promedioMonto: pagos.length > 0 ? totalMonto / pagos.length : 0,
      pagosPorMetodo,
      pagosPorMes
    };
  }
}
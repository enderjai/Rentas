import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  and,
  or
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { 
  CONTRATO_COLECCION, 
  LOCAL_COLECCION, 
  INQUILINO_COLECCION, 
  PAGOS_COLECCION,
  NOTIFICACIONES_COLECCION
} from '../utils/constants';
import { Contrato, ContratoFormData, ContratoFilters, Renovacion } from '../types/contrato';

export class ContratosService {
  // Obtener todos los contratos con filtros
  static async getContratos(filtros?: ContratoFilters): Promise<Contrato[]> {
    const constraints = [];
    
    if (filtros?.estado && filtros.estado !== 'todos') {
      constraints.push(where('estado', '==', filtros.estado));
    }
    
    if (filtros?.localId) {
      constraints.push(where('localId', '==', filtros.localId));
    }
    
    if (filtros?.inquilinoId) {
      constraints.push(where('inquilinoId', '==', filtros.inquilinoId));
    }
    
    constraints.push(orderBy('fechaInicio', 'desc'));
    
    let contratos = await FirestoreService.getAll<Contrato>(CONTRATO_COLECCION, constraints);
    
    // Buscar por nombre de local o inquilino
    if (filtros?.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      const contratosEnriquecidos = await this.enriquecerContratos(contratos);
      contratos = contratosEnriquecidos.filter(c => 
        c.localNombre?.toLowerCase().includes(busquedaLower) ||
        c.inquilinoNombre?.toLowerCase().includes(busquedaLower)
      );
    } else {
      await this.enriquecerContratos(contratos);
    }
    
    // Calcular días restantes y estado de pago
    for (const contrato of contratos) {
      contrato.diasRestantes = this.calcularDiasRestantes(contrato);
      const estadoPago = await this.calcularEstadoPago(contrato.id);
      contrato.estadoPago = estadoPago.estado;
      contrato.totalPagado = estadoPago.totalPagado;
      contrato.mesesPagados = estadoPago.mesesPagados;
    }
    
    return contratos;
  }

  // Obtener un contrato por ID con datos adicionales
  static async getContratoById(id: string): Promise<Contrato | null> {
    const contrato = await FirestoreService.getById<Contrato>(CONTRATO_COLECCION, id);
    if (contrato) {
      const enriquecidos = await this.enriquecerContratos([contrato]);
      const enriquecido = enriquecidos[0];
      enriquecido.diasRestantes = this.calcularDiasRestantes(enriquecido);
      const estadoPago = await this.calcularEstadoPago(id);
      enriquecido.estadoPago = estadoPago.estado;
      enriquecido.totalPagado = estadoPago.totalPagado;
      enriquecido.mesesPagados = estadoPago.mesesPagados;
      return enriquecido;
    }
    return null;
  }

  // Enriquecer contratos con información de locales e inquilinos
  static async enriquecerContratos(contratos: Contrato[]): Promise<Contrato[]> {
    for (const contrato of contratos) {
      // Obtener local
      if (contrato.localId) {
        const local = await FirestoreService.getById<any>(LOCAL_COLECCION, contrato.localId);
        if (local) {
          contrato.localNombre = local.nombre;
        }
      }
      
      // Obtener inquilino
      if (contrato.inquilinoId) {
        const inquilino = await FirestoreService.getById<any>(INQUILINO_COLECCION, contrato.inquilinoId);
        if (inquilino) {
          contrato.inquilinoNombre = inquilino.nombre;
        }
      }
    }
    return contratos;
  }

  // Crear un nuevo contrato con validaciones
  static async createContrato(
    data: ContratoFormData,
    creadoPor: string
  ): Promise<{ success: boolean; contrato?: Contrato; error?: string }> {
    try {
      // Validar que el local esté disponible
      const localDisponible = await this.verificarLocalDisponible(data.localId);
      if (!localDisponible) {
        return { 
          success: false, 
          error: 'El local ya tiene un contrato vigente o no está disponible' 
        };
      }

      // Validar que el inquilino exista
      const inquilino = await FirestoreService.getById<any>(INQUILINO_COLECCION, data.inquilinoId);
      if (!inquilino) {
        return { success: false, error: 'El inquilino no existe' };
      }

      // Validar fechas
      if (data.fechaFin <= data.fechaInicio) {
        return { success: false, error: 'La fecha de fin debe ser mayor a la fecha de inicio' };
      }

      // Validar día de pago
      if (data.diaPago < 1 || data.diaPago > 31) {
        return { success: false, error: 'El día de pago debe estar entre 1 y 31' };
      }

      // Crear el contrato
      const contratoData = {
        ...data,
        estado: 'vigente',
        renovaciones: [],
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        creadoPor
      };

      const contrato = await FirestoreService.create<Contrato>(CONTRATO_COLECCION, contratoData);

      // Actualizar el local a ocupado
      await this.actualizarLocal(data.localId, 'ocupado');

      // Actualizar el localActual del inquilino
      await this.actualizarInquilino(data.inquilinoId, data.localId, contrato.id);

      // Generar notificaciones iniciales
      await this.generarNotificacionesVencimiento(contrato.id);

      return { success: true, contrato };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al crear el contrato' 
      };
    }
  }

  // Actualizar un contrato
  static async updateContrato(
    id: string,
    data: Partial<ContratoFormData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const contratoActual = await this.getContratoById(id);
      if (!contratoActual) {
        return { success: false, error: 'Contrato no encontrado' };
      }

      // Si se cambia el local, verificar disponibilidad
      if (data.localId && data.localId !== contratoActual.localId) {
        const localDisponible = await this.verificarLocalDisponible(data.localId, id);
        if (!localDisponible) {
          return { 
            success: false, 
            error: 'El local ya tiene un contrato vigente' 
          };
        }
      }

      // Validar fechas si se actualizan
      const fechaInicio = data.fechaInicio || contratoActual.fechaInicio;
      const fechaFin = data.fechaFin || contratoActual.fechaFin;
      if (fechaFin <= fechaInicio) {
        return { success: false, error: 'La fecha de fin debe ser mayor a la fecha de inicio' };
      }

      await FirestoreService.update(CONTRATO_COLECCION, id, {
        ...data,
        fechaActualizacion: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al actualizar el contrato' 
      };
    }
  }

  // Cambiar estado del contrato
  static async cambiarEstado(
    id: string,
    nuevoEstado: 'vigente' | 'vencido' | 'renovado' | 'rescindido',
    motivo?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const contrato = await this.getContratoById(id);
      if (!contrato) {
        return { success: false, error: 'Contrato no encontrado' };
      }

      const batch = writeBatch(db);
      const contratoRef = doc(db, CONTRATO_COLECCION, id);

      // Actualizar estado del contrato
      batch.update(contratoRef, {
        estado: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      });

      // Actualizar local según el nuevo estado
      if (nuevoEstado === 'vencido' || nuevoEstado === 'rescindido') {
        await this.actualizarLocal(contrato.localId, 'disponible');
        await this.desasignarInquilino(contrato.inquilinoId);
      }

      // Si es rescindido, agregar motivo
      if (nuevoEstado === 'rescindido' && motivo) {
        // Podríamos agregar un campo motivoRescision
        batch.update(contratoRef, {
          motivoRescision: motivo
        });
      }

      await batch.commit();

      // Generar notificación si es necesario
      if (nuevoEstado === 'rescindido' || nuevoEstado === 'vencido') {
        await this.generarNotificacion(
          'admin',
          `Contrato ${id} ha sido ${nuevoEstado}`,
          'estado_contrato'
        );
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al cambiar el estado' 
      };
    }
  }

  // Renovar contrato (crear nuevo contrato a partir de uno vigente)
  static async renovarContrato(
    id: string,
    nuevaFechaFin: Date,
    nuevoMonto?: number,
    motivo?: string
  ): Promise<{ success: boolean; nuevoContrato?: Contrato; error?: string }> {
    try {
      const contratoActual = await this.getContratoById(id);
      if (!contratoActual) {
        return { success: false, error: 'Contrato no encontrado' };
      }

      if (contratoActual.estado !== 'vigente') {
        return { success: false, error: 'Solo se pueden renovar contratos vigentes' };
      }

      // Crear nuevo contrato
      const nuevoContratoData: ContratoFormData = {
        localId: contratoActual.localId,
        inquilinoId: contratoActual.inquilinoId,
        fechaInicio: new Date(),
        fechaFin: nuevaFechaFin,
        montoRenta: nuevoMonto || contratoActual.montoRenta,
        diaPago: contratoActual.diaPago,
        depositoGarantia: contratoActual.depositoGarantia,
        formaPago: contratoActual.formaPago,
        clausulas: contratoActual.clausulas,
        documentoUrl: contratoActual.documentoUrl
      };

      const result = await this.createContrato(
        nuevoContratoData,
        contratoActual.creadoPor
      );

      if (!result.success) {
        return result;
      }

      // Actualizar el contrato actual a 'renovado'
      await this.cambiarEstado(id, 'renovado');

      // Agregar renovación al historial
      const renovacion: Renovacion = {
        fecha: new Date(),
        nuevoFin: nuevaFechaFin,
        nuevoMonto: nuevoMonto || contratoActual.montoRenta,
        motivo: motivo || 'Renovación automática'
      };

      const contratoRef = doc(db, CONTRATO_COLECCION, id);
      await updateDoc(contratoRef, {
        renovaciones: [...contratoActual.renovaciones, renovacion],
        fechaActualizacion: serverTimestamp()
      });

      return { success: true, nuevoContrato: result.contrato };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al renovar el contrato' 
      };
    }
  }

  // Subir documento PDF del contrato
  static async subirDocumentoContrato(
    contratoId: string,
    archivo: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const path = `contratos/${contratoId}/documento_${Date.now()}.pdf`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);
      
      await FirestoreService.update(CONTRATO_COLECCION, contratoId, {
        documentoUrl: url,
        fechaActualizacion: serverTimestamp()
      });
      
      return { success: true, url };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al subir el documento' 
      };
    }
  }

  // Verificar si un local está disponible para nuevo contrato
  static async verificarLocalDisponible(
    localId: string, 
    contratoIdExcluir?: string
  ): Promise<boolean> {
    const q = query(
      collection(db, CONTRATO_COLECCION),
      where('localId', '==', localId),
      where('estado', '==', 'vigente')
    );
    
    const snapshot = await getDocs(q);
    
    // Si hay un contrato vigente que no sea el que se está editando
    if (contratoIdExcluir) {
      return snapshot.docs.every(doc => doc.id === contratoIdExcluir);
    }
    
    return snapshot.empty;
  }

  // Actualizar estado del local
  static async actualizarLocal(localId: string, estado: 'ocupado' | 'disponible'): Promise<void> {
    await FirestoreService.update(LOCAL_COLECCION, localId, {
      estado,
      fechaActualizacion: serverTimestamp()
    });
  }

  // Actualizar inquilino con el local actual
  static async actualizarInquilino(
    inquilinoId: string, 
    localId: string, 
    contratoId: string
  ): Promise<void> {
    const inquilinoRef = doc(db, INQUILINO_COLECCION, inquilinoId);
    await updateDoc(inquilinoRef, {
      localActual: localId,
      contratos: arrayUnion(contratoId),
      fechaActualizacion: serverTimestamp()
    });
  }

  // Desasignar local del inquilino
  static async desasignarInquilino(inquilinoId: string): Promise<void> {
    const inquilinoRef = doc(db, INQUILINO_COLECCION, inquilinoId);
    await updateDoc(inquilinoRef, {
      localActual: null,
      fechaActualizacion: serverTimestamp()
    });
  }

  // Calcular días restantes
  static calcularDiasRestantes(contrato: Contrato): number {
    const hoy = new Date();
    const fechaFin = new Date(contrato.fechaFin);
    const diffTime = fechaFin.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Calcular estado de pago del contrato
  static async calcularEstadoPago(contratoId: string): Promise<{
    estado: 'pagado' | 'pendiente' | 'atrasado';
    totalPagado: number;
    mesesPagados: number;
  }> {
    const contrato = await this.getContratoById(contratoId);
    if (!contrato) {
      return { estado: 'pendiente', totalPagado: 0, mesesPagados: 0 };
    }

    // Obtener todos los pagos del contrato
    const q = query(
      collection(db, PAGOS_COLECCION),
      where('contratoId', '==', contratoId),
      orderBy('fechaPago', 'desc')
    );
    const snapshot = await getDocs(q);
    const pagos = snapshot.docs.map(doc => doc.data());

    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const mesesPagados = pagos.length;

    // Verificar si el mes actual está pagado
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const pagoMesActual = pagos.some(p => p.mesCorrespondiente === mesActual);

    if (pagoMesActual) {
      return { estado: 'pagado', totalPagado, mesesPagados };
    }

    // Verificar si hay atraso
    const diaPago = contrato.diaPago;
    const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), diaPago);
    const diasAtraso = Math.ceil((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

    if (diasAtraso > 0) {
      return { estado: 'atrasado', totalPagado, mesesPagados };
    }

    return { estado: 'pendiente', totalPagado, mesesPagados };
  }

  // Generar notificaciones de vencimiento
  static async generarNotificacionesVencimiento(contratoId: string): Promise<void> {
    const contrato = await this.getContratoById(contratoId);
    if (!contrato) return;

    const fechaFin = new Date(contrato.fechaFin);
    const hoy = new Date();
    const diasRestantes = this.calcularDiasRestantes(contrato);

    const umbrales = [30, 15, 7];
    for (const umbral of umbrales) {
      if (diasRestantes === umbral) {
        await this.generarNotificacion(
          'admin',
          `El contrato del local "${contrato.localNombre}" vence en ${umbral} días`,
          'vencimiento'
        );
        break;
      }
    }
  }

  // Generar notificación genérica
  static async generarNotificacion(
    destinatario: string,
    mensaje: string,
    tipo: string
  ): Promise<void> {
    await FirestoreService.create(NOTIFICACIONES_COLECCION, {
      destinatario,
      mensaje,
      tipo,
      fecha: new Date().toISOString(),
      leida: false,
      timestamp: serverTimestamp()
    });
  }

  // Verificar contratos vencidos (para ejecutar periódicamente)
  static async verificarContratosVencidos(): Promise<void> {
    const hoy = new Date();
    const q = query(
      collection(db, CONTRATO_COLECCION),
      where('estado', '==', 'vigente'),
      where('fechaFin', '<', hoy)
    );
    const snapshot = await getDocs(q);

    for (const docSnapshot of snapshot.docs) {
      await this.cambiarEstado(docSnapshot.id, 'vencido');
    }
  }

  // Escuchar cambios en tiempo real
  static listenToContratos(
    callback: (contratos: Contrato[]) => void,
    filtros?: ContratoFilters
  ) {
    const constraints = [];
    
    if (filtros?.estado && filtros.estado !== 'todos') {
      constraints.push(where('estado', '==', filtros.estado));
    }
    
    if (filtros?.localId) {
      constraints.push(where('localId', '==', filtros.localId));
    }
    
    if (filtros?.inquilinoId) {
      constraints.push(where('inquilinoId', '==', filtros.inquilinoId));
    }
    
    constraints.push(orderBy('fechaInicio', 'desc'));
    
    return FirestoreService.listenToCollection<Contrato>(
      CONTRATO_COLECCION,
      async (contratos) => {
        await this.enriquecerContratos(contratos);
        for (const contrato of contratos) {
          contrato.diasRestantes = this.calcularDiasRestantes(contrato);
          const estadoPago = await this.calcularEstadoPago(contrato.id);
          contrato.estadoPago = estadoPago.estado;
          contrato.totalPagado = estadoPago.totalPagado;
          contrato.mesesPagados = estadoPago.mesesPagados;
        }
        callback(contratos);
      },
      constraints
    );
  }

  // Escuchar un contrato específico
  static listenToContrato(
    contratoId: string,
    callback: (contrato: Contrato | null) => void
  ) {
    return FirestoreService.listenToDoc<Contrato>(
      CONTRATO_COLECCION,
      contratoId,
      async (contrato) => {
        if (contrato) {
          const enriquecidos = await this.enriquecerContratos([contrato]);
          const enriquecido = enriquecidos[0];
          enriquecido.diasRestantes = this.calcularDiasRestantes(enriquecido);
          const estadoPago = await this.calcularEstadoPago(contratoId);
          enriquecido.estadoPago = estadoPago.estado;
          enriquecido.totalPagado = estadoPago.totalPagado;
          enriquecido.mesesPagados = estadoPago.mesesPagados;
          callback(enriquecido);
        } else {
          callback(null);
        }
      }
    );
  }

  // Obtener estadísticas de contratos
  static async getEstadisticas(): Promise<{
    total: number;
    vigentes: number;
    vencidos: number;
    renovados: number;
    rescindidos: number;
    ingresoMensual: number;
    promedioRenta: number;
  }> {
    const contratos = await this.getContratos();
    const vigentes = contratos.filter(c => c.estado === 'vigente');
    
    return {
      total: contratos.length,
      vigentes: vigentes.length,
      vencidos: contratos.filter(c => c.estado === 'vencido').length,
      renovados: contratos.filter(c => c.estado === 'renovado').length,
      rescindidos: contratos.filter(c => c.estado === 'rescindido').length,
      ingresoMensual: vigentes.reduce((sum, c) => sum + c.montoRenta, 0),
      promedioRenta: vigentes.length > 0 ? 
        vigentes.reduce((sum, c) => sum + c.montoRenta, 0) / vigentes.length : 0
    };
  }
}
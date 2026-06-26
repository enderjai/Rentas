import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  getDocs,
  writeBatch,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { 
  LOCAL_COLECCION, 
  CONTRATOS_COLECCION, 
  INQUILINOS_COLECCION,
  PAGOS_COLECCION 
} from '../utils/constants';
import { Local, LocalFormData, Documento, HistorialOcupante } from '../types';

export class LocalesService {
  // Obtener todos los locales con filtros
  static async getLocales(filtros?: {
    estado?: string;
    tipo?: string;
    busqueda?: string;
  }): Promise<Local[]> {
    const constraints = [];
    
    if (filtros?.estado && filtros.estado !== 'todos') {
      constraints.push(where('estado', '==', filtros.estado));
    }
    
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    constraints.push(orderBy('nombre', 'asc'));
    
    let locales = await FirestoreService.getAll<Local>(LOCAL_COLECCION, constraints);
    
    // Búsqueda por nombre o dirección
    if (filtros?.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      locales = locales.filter(local => 
        local.nombre.toLowerCase().includes(busquedaLower) ||
        local.direccion.toLowerCase().includes(busquedaLower)
      );
    }
    
    return locales;
  }

  // Obtener un local por ID con datos adicionales
  static async getLocalById(id: string): Promise<Local | null> {
    return await FirestoreService.getById<Local>(LOCAL_COLECCION, id);
  }

  // Crear un nuevo local
  static async createLocal(data: LocalFormData, creadoPor: string): Promise<Local> {
    const localData = {
      ...data,
      estado: data.estado || 'disponible',
      documentos: [],
      historialOcupantes: [],
      creadoPor,
    };
    
    return await FirestoreService.create<Local>(LOCAL_COLECCION, localData);
  }

  // Actualizar un local
  static async updateLocal(id: string, data: Partial<LocalFormData>): Promise<void> {
    await FirestoreService.update(LOCAL_COLECCION, id, data);
  }

  // Eliminar un local (solo si no tiene contratos activos)
  static async deleteLocal(id: string): Promise<{ success: boolean; error?: string }> {
    // Verificar si tiene contratos activos
    const contratosActivos = await this.getContratosActivos(id);
    if (contratosActivos > 0) {
      return { 
        success: false, 
        error: 'No se puede eliminar el local porque tiene contratos activos' 
      };
    }
    
    await FirestoreService.delete(LOCAL_COLECCION, id);
    return { success: true };
  }

  // Cambiar estado del local con validaciones
  static async cambiarEstado(
    localId: string, 
    nuevoEstado: 'ocupado' | 'disponible' | 'mantenimiento'
  ): Promise<{ success: boolean; error?: string }> {
    const local = await this.getLocalById(localId);
    if (!local) {
      return { success: false, error: 'Local no encontrado' };
    }

    // Validación: No se puede marcar como ocupado sin contrato activo
    if (nuevoEstado === 'ocupado') {
      const contratosActivos = await this.getContratosActivos(localId);
      if (contratosActivos === 0) {
        return { 
          success: false, 
          error: 'No se puede marcar como ocupado sin un contrato activo' 
        };
      }
    }

    // Validación: No se puede cambiar a disponible si tiene contrato vigente
    if (nuevoEstado === 'disponible' && local.estado === 'ocupado') {
      const contratosVigentes = await this.getContratosVigentes(localId);
      if (contratosVigentes > 0) {
        return { 
          success: false, 
          error: 'No se puede cambiar a disponible porque tiene un contrato vigente' 
        };
      }
    }

    await FirestoreService.update(LOCAL_COLECCION, localId, { estado: nuevoEstado });
    return { success: true };
  }

  // Subir documento al local
  static async subirDocumento(
    localId: string, 
    archivo: File, 
    visibilidad: 'admin' | 'inquilino' | 'publico',
    userId: string
  ): Promise<Documento> {
    const path = `locales/${localId}/documentos/${Date.now()}_${archivo.name}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);
    
    const documento: Documento = {
      id: Date.now().toString(),
      nombre: archivo.name,
      url,
      tipo: archivo.type,
      visibilidad,
      fechaSubida: new Date(),
      tamano: archivo.size
    };
    
    // Actualizar el local con el nuevo documento
    const localRef = doc(db, LOCAL_COLECCION, localId);
    await updateDoc(localRef, {
      documentos: arrayUnion(documento),
      fechaActualizacion: serverTimestamp()
    });
    
    return documento;
  }

  // Eliminar documento del local
  static async eliminarDocumento(localId: string, documentoId: string): Promise<void> {
    const local = await this.getLocalById(localId);
    if (!local) return;
    
    const documento = local.documentos.find(d => d.id === documentoId);
    if (documento) {
      // Eliminar del Storage
      try {
        const storageRef = ref(storage, documento.url);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn('Error al eliminar archivo del Storage:', error);
      }
    }
    
    // Eliminar del array de documentos
    const localRef = doc(db, LOCAL_COLECCION, localId);
    await updateDoc(localRef, {
      documentos: arrayRemove(documento),
      fechaActualizacion: serverTimestamp()
    });
  }

  // Obtener contratos activos de un local
  static async getContratosActivos(localId: string): Promise<number> {
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('localId', '==', localId),
      where('estado', '==', 'vigente')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Obtener contratos vigentes (con fecha fin >= hoy)
  static async getContratosVigentes(localId: string): Promise<number> {
    const hoy = new Date();
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('localId', '==', localId),
      where('estado', '==', 'vigente'),
      where('fechaFin', '>=', hoy)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Obtener información del contrato actual del local
  static async getContratoActual(localId: string): Promise<any | null> {
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('localId', '==', localId),
      where('estado', '==', 'vigente'),
      orderBy('fechaInicio', 'desc')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const contratoDoc = snapshot.docs[0];
    const contrato = contratoDoc.data();
    
    // Obtener información del inquilino
    const inquilino = await FirestoreService.getById<any>(
      INQUILINOS_COLECCION, 
      contrato.inquilinoId
    );
    
    // Obtener pagos del contrato
    const pagosQuery = query(
      collection(db, PAGOS_COLECCION),
      where('contratoId', '==', contratoDoc.id),
      orderBy('fechaPago', 'desc')
    );
    const pagosSnapshot = await getDocs(pagosQuery);
    const pagos = pagosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      id: contratoDoc.id,
      ...contrato,
      inquilino: inquilino || null,
      pagos: pagos || []
    };
  }

  // Obtener historial completo de ocupantes
  static async getHistorialOcupantes(localId: string): Promise<HistorialOcupante[]> {
    const local = await this.getLocalById(localId);
    if (!local) return [];
    
    const historial = [];
    for (const ocupante of local.historialOcupantes || []) {
      const inquilino = await FirestoreService.getById<any>(
        INQUILINOS_COLECCION,
        ocupante.inquilinoId
      );
      historial.push({
        ...ocupante,
        inquilinoNombre: inquilino?.nombre || 'Desconocido'
      });
    }
    
    return historial;
  }

  // Escuchar cambios en tiempo real de los locales
  static listenToLocales(
    callback: (locales: Local[]) => void,
    filtros?: {
      estado?: string;
      tipo?: string;
    }
  ) {
    const constraints = [];
    
    if (filtros?.estado && filtros.estado !== 'todos') {
      constraints.push(where('estado', '==', filtros.estado));
    }
    
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    constraints.push(orderBy('nombre', 'asc'));
    
    return FirestoreService.listenToCollection<Local>(
      LOCAL_COLECCION,
      callback,
      constraints
    );
  }

  // Escuchar un local específico en tiempo real
  static listenToLocal(
    localId: string,
    callback: (local: Local | null) => void
  ) {
    return FirestoreService.listenToDoc<Local>(
      LOCAL_COLECCION,
      localId,
      callback
    );
  }

  // Agregar al historial de ocupantes
  static async agregarHistorialOcupante(
    localId: string,
    ocupante: Omit<HistorialOcupante, 'inquilinoNombre'>
  ): Promise<void> {
    const localRef = doc(db, LOCAL_COLECCION, localId);
    await updateDoc(localRef, {
      historialOcupantes: arrayUnion(ocupante),
      fechaActualizacion: serverTimestamp()
    });
  }

  // Actualizar historial de ocupantes (finalizar ocupación)
  static async finalizarOcupacion(
    localId: string,
    inquilinoId: string,
    fechaFin: Date
  ): Promise<void> {
    const local = await this.getLocalById(localId);
    if (!local) return;
    
    const historialActualizado = local.historialOcupantes.map(ocupante => {
      if (ocupante.inquilinoId === inquilinoId && !ocupante.fechaFin) {
        return { ...ocupante, fechaFin };
      }
      return ocupante;
    });
    
    const localRef = doc(db, LOCAL_COLECCION, localId);
    await updateDoc(localRef, {
      historialOcupantes: historialActualizado,
      fechaActualizacion: serverTimestamp()
    });
  }
}
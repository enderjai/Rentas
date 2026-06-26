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
  getDoc,
  writeBatch,
  serverTimestamp,
  and,
  or
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  deleteUser 
} from 'firebase/auth';
import { db, storage, auth } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { 
  INQUILINO_COLECCION, 
  USUARIOS_COLECCION,
  CONTRATOS_COLECCION,
  LOCAL_COLECCION,
  PAGOS_COLECCION 
} from '../utils/constants';
import { Inquilino, InquilinoFormData, InquilinoFilters, DocumentoInquilino } from '../types/inquilino';

export class InquilinosService {
  // Obtener todos los inquilinos con filtros
  static async getInquilinos(filtros?: InquilinoFilters): Promise<Inquilino[]> {
    const constraints = [];
    
    if (filtros?.activo !== undefined && filtros.activo !== null) {
      constraints.push(where('activo', '==', filtros.activo));
    }
    
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    constraints.push(orderBy('nombre', 'asc'));
    
    let inquilinos = await FirestoreService.getAll<Inquilino>(INQUILINO_COLECCION, constraints);
    
    // Búsqueda por nombre, RFC o email
    if (filtros?.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      inquilinos = inquilinos.filter(inquilino => 
        inquilino.nombre.toLowerCase().includes(busquedaLower) ||
        inquilino.rfc.toLowerCase().includes(busquedaLower) ||
        inquilino.email.toLowerCase().includes(busquedaLower)
      );
    }
    
    // Obtener información adicional
    await this.enriquecerInquilinos(inquilinos);
    
    return inquilinos;
  }

  // Obtener un inquilino por ID con datos adicionales
  static async getInquilinoById(id: string): Promise<Inquilino | null> {
    const inquilino = await FirestoreService.getById<Inquilino>(INQUILINO_COLECCION, id);
    if (inquilino) {
      await this.enriquecerInquilinos([inquilino]);
    }
    return inquilino;
  }

  // Enriquecer datos de inquilinos con información relacionada
  static async enriquecerInquilinos(inquilinos: Inquilino[]): Promise<void> {
    for (const inquilino of inquilinos) {
      // Obtener local actual
      if (inquilino.localActual) {
        const local = await FirestoreService.getById<any>(LOCAL_COLECCION, inquilino.localActual);
        if (local) {
          inquilino.localNombre = local.nombre;
        }
      }
      
      // Obtener contrato actual
      if (inquilino.contratos && inquilino.contratos.length > 0) {
        const contratoActual = await this.getContratoActual(inquilino.id);
        if (contratoActual) {
          inquilino.contratoActual = contratoActual;
        }
      }
    }
  }

  // Crear un nuevo inquilino
  static async createInquilino(
    data: InquilinoFormData,
    crearUsuario: boolean = false
  ): Promise<{ success: boolean; inquilino?: Inquilino; error?: string }> {
    try {
      let userId = null;
      
      // Crear usuario en Auth si se solicita
      if (crearUsuario) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            this.generatePassword()
          );
          userId = userCredential.user.uid;
          
          // Crear documento de usuario en Firestore
          await FirestoreService.create(USUARIOS_COLECCION, {
            email: data.email,
            nombre: data.nombre,
            rol: 'inquilino',
            inquilinoId: null, // Se actualizará después
            uid: userCredential.user.uid,
            createdAt: serverTimestamp()
          });
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            return { 
              success: false, 
              error: 'El email ya está registrado en el sistema' 
            };
          }
          throw error;
        }
      }
      
      // Crear el documento del inquilino
      const inquilinoData = {
        ...data,
        documentos: [],
        contratos: [],
        localActual: null,
        activo: true,
        userId: userId || null,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };
      
      const inquilino = await FirestoreService.create<Inquilino>(
        INQUILINO_COLECCION, 
        inquilinoData
      );
      
      // Si se creó usuario, actualizar el documento con el inquilinoId
      if (userId) {
        const usuariosQuery = query(
          collection(db, USUARIOS_COLECCION),
          where('uid', '==', userId)
        );
        const snapshot = await getDocs(usuariosQuery);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await updateDoc(userDoc.ref, {
            inquilinoId: inquilino.id
          });
        }
      }
      
      return { success: true, inquilino };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al crear el inquilino' 
      };
    }
  }

  // Actualizar un inquilino
  static async updateInquilino(
    id: string, 
    data: Partial<InquilinoFormData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await FirestoreService.update(INQUILINO_COLECCION, id, {
        ...data,
        fechaActualizacion: serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al actualizar el inquilino' 
      };
    }
  }

  // Eliminar un inquilino (solo si no tiene contratos activos)
  static async deleteInquilino(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si tiene contratos activos
      const contratosActivos = await this.getContratosActivos(id);
      if (contratosActivos > 0) {
        return { 
          success: false, 
          error: 'No se puede eliminar el inquilino porque tiene contratos activos' 
        };
      }
      
      const inquilino = await this.getInquilinoById(id);
      
      // Si tiene usuario asociado, desactivarlo (no eliminar por seguridad)
      if (inquilino?.userId) {
        const usuariosQuery = query(
          collection(db, USUARIOS_COLECCION),
          where('uid', '==', inquilino.userId)
        );
        const snapshot = await getDocs(usuariosQuery);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await updateDoc(userDoc.ref, {
            activo: false,
            inquilinoId: null
          });
        }
      }
      
      // Eliminar documentos del Storage
      if (inquilino?.documentos) {
        for (const doc of inquilino.documentos) {
          try {
            const storageRef = ref(storage, doc.url);
            await deleteObject(storageRef);
          } catch (error) {
            console.warn('Error al eliminar documento:', error);
          }
        }
      }
      
      await FirestoreService.delete(INQUILINO_COLECCION, id);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al eliminar el inquilino' 
      };
    }
  }

  // Subir documento
  static async subirDocumento(
    inquilinoId: string,
    archivo: File,
    tipo: 'identificacion' | 'domicilio' | 'referencia' | 'otro'
  ): Promise<DocumentoInquilino> {
    const path = `inquilinos/${inquilinoId}/documentos/${Date.now()}_${archivo.name}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);
    
    const documento: DocumentoInquilino = {
      id: Date.now().toString(),
      nombre: archivo.name,
      url,
      tipo,
      fechaSubida: new Date(),
      tamano: archivo.size
    };
    
    const inquilinoRef = doc(db, INQUILINO_COLECCION, inquilinoId);
    await updateDoc(inquilinoRef, {
      documentos: arrayUnion(documento),
      fechaActualizacion: serverTimestamp()
    });
    
    return documento;
  }

  // Eliminar documento
  static async eliminarDocumento(inquilinoId: string, documentoId: string): Promise<void> {
    const inquilino = await this.getInquilinoById(inquilinoId);
    if (!inquilino) return;
    
    const documento = inquilino.documentos.find(d => d.id === documentoId);
    if (documento) {
      try {
        const storageRef = ref(storage, documento.url);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn('Error al eliminar archivo del Storage:', error);
      }
    }
    
    const inquilinoRef = doc(db, INQUILINO_COLECCION, inquilinoId);
    await updateDoc(inquilinoRef, {
      documentos: arrayRemove(documento),
      fechaActualizacion: serverTimestamp()
    });
  }

  // Obtener contratos de un inquilino
  static async getContratos(inquilinoId: string): Promise<any[]> {
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('inquilinoId', '==', inquilinoId),
      orderBy('fechaInicio', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const contratos = [];
    for (const docSnapshot of snapshot.docs) {
      const contrato = docSnapshot.data();
      const local = await FirestoreService.getById<any>(
        LOCAL_COLECCION,
        contrato.localId
      );
      contratos.push({
        id: docSnapshot.id,
        ...contrato,
        localNombre: local?.nombre || 'Local desconocido'
      });
    }
    
    return contratos;
  }

  // Obtener contrato actual
  static async getContratoActual(inquilinoId: string): Promise<any | null> {
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('inquilinoId', '==', inquilinoId),
      where('estado', '==', 'vigente'),
      orderBy('fechaInicio', 'desc')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnapshot = snapshot.docs[0];
    const contrato = docSnapshot.data();
    const local = await FirestoreService.getById<any>(
      LOCAL_COLECCION,
      contrato.localId
    );
    
    return {
      id: docSnapshot.id,
      ...contrato,
      localNombre: local?.nombre || 'Local desconocido'
    };
  }

  // Obtener contratos activos (para validación)
  static async getContratosActivos(inquilinoId: string): Promise<number> {
    const q = query(
      collection(db, CONTRATOS_COLECCION),
      where('inquilinoId', '==', inquilinoId),
      where('estado', '==', 'vigente')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Obtener historial de pagos
  static async getHistorialPagos(inquilinoId: string): Promise<any[]> {
    // Obtener todos los contratos del inquilino
    const contratos = await this.getContratos(inquilinoId);
    const contratoIds = contratos.map(c => c.id);
    
    if (contratoIds.length === 0) return [];
    
    const q = query(
      collection(db, PAGOS_COLECCION),
      where('contratoId', 'in', contratoIds),
      orderBy('fechaPago', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // Asignar local a inquilino (mediante contrato)
  static async asignarLocal(
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

  // Desasignar local
  static async desasignarLocal(inquilinoId: string): Promise<void> {
    const inquilinoRef = doc(db, INQUILINO_COLECCION, inquilinoId);
    await updateDoc(inquilinoRef, {
      localActual: null,
      fechaActualizacion: serverTimestamp()
    });
  }

  // Generar contraseña aleatoria
  static generatePassword(length: number = 10): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  // Enviar restablecimiento de contraseña
  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  // Escuchar cambios en tiempo real
  static listenToInquilinos(
    callback: (inquilinos: Inquilino[]) => void,
    filtros?: InquilinoFilters
  ) {
    const constraints = [];
    
    if (filtros?.activo !== undefined && filtros?.activo !== null) {
      constraints.push(where('activo', '==', filtros.activo));
    }
    
    if (filtros?.tipo && filtros.tipo !== 'todos') {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    constraints.push(orderBy('nombre', 'asc'));
    
    return FirestoreService.listenToCollection<Inquilino>(
      INQUILINO_COLECCION,
      async (inquilinos) => {
        // Filtrar por búsqueda si existe
        if (filtros?.busqueda) {
          const busquedaLower = filtros.busqueda.toLowerCase();
          inquilinos = inquilinos.filter(inquilino => 
            inquilino.nombre.toLowerCase().includes(busquedaLower) ||
            inquilino.rfc.toLowerCase().includes(busquedaLower) ||
            inquilino.email.toLowerCase().includes(busquedaLower)
          );
        }
        await this.enriquecerInquilinos(inquilinos);
        callback(inquilinos);
      },
      constraints
    );
  }

  // Escuchar un inquilino específico
  static listenToInquilino(
    inquilinoId: string,
    callback: (inquilino: Inquilino | null) => void
  ) {
    return FirestoreService.listenToDoc<Inquilino>(
      INQUILINO_COLECCION,
      inquilinoId,
      async (inquilino) => {
        if (inquilino) {
          await this.enriquecerInquilinos([inquilino]);
        }
        callback(inquilino);
      }
    );
  }

  // Obtener estadísticas de inquilinos
  static async getEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    personas: number;
    empresas: number;
    conLocal: number;
  }> {
    const inquilinos = await this.getInquilinos();
    
    return {
      total: inquilinos.length,
      activos: inquilinos.filter(i => i.activo).length,
      inactivos: inquilinos.filter(i => !i.activo).length,
      personas: inquilinos.filter(i => i.tipo === 'persona').length,
      empresas: inquilinos.filter(i => i.tipo === 'empresa').length,
      conLocal: inquilinos.filter(i => i.localActual).length
    };
  }
}
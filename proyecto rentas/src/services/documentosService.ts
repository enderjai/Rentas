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
  or
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { DOCUMENTO_COLECCION } from '../utils/constants';
import { Documento, DocumentoFormData, DocumentoFiltros, DocumentoStats } from '../types/documentos';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

export class DocumentosService {
  // Obtener documentos con filtros
  static async getDocumentos(filtros?: DocumentoFiltros): Promise<Documento[]> {
    const constraints = [];
    
    if (filtros?.entidadTipo) {
      constraints.push(where('entidadTipo', '==', filtros.entidadTipo));
    }
    
    if (filtros?.entidadId) {
      constraints.push(where('entidadId', '==', filtros.entidadId));
    }
    
    if (filtros?.tipo) {
      constraints.push(where('tipo', '==', filtros.tipo));
    }
    
    if (filtros?.visibilidad) {
      constraints.push(where('visibilidad', '==', filtros.visibilidad));
    }
    
    if (filtros?.fechaInicio && filtros?.fechaFin) {
      constraints.push(where('fechaSubida', '>=', filtros.fechaInicio));
      constraints.push(where('fechaSubida', '<=', filtros.fechaFin));
    }
    
    constraints.push(orderBy('fechaSubida', 'desc'));
    
    return await FirestoreService.getAll<Documento>(DOCUMENTO_COLECCION, constraints);
  }

  // Obtener documentos por entidad
  static async getDocumentosPorEntidad(entidadTipo: string, entidadId: string): Promise<Documento[]> {
    return await this.getDocumentos({ entidadTipo, entidadId });
  }

  // Subir documento con compresión de imágenes
  static async subirDocumento(
    data: DocumentoFormData,
    entidadTipo: 'local' | 'inquilino' | 'contrato' | 'pago',
    entidadId: string,
    subidoPor: string
  ): Promise<{ success: boolean; documento?: Documento; error?: string; progreso?: number }> {
    try {
      let archivo = data.archivo;
      
      // Comprimir si es imagen
      if (archivo.type.startsWith('image/')) {
        try {
          archivo = await this.comprimirImagen(archivo);
        } catch (error) {
          console.warn('Error al comprimir imagen, usando original:', error);
        }
      }

      // Validar tamaño
      if (archivo.size > MAX_FILE_SIZE) {
        return { 
          success: false, 
          error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
        };
      }

      // Generar nombre único
      const nombreUnico = `${Date.now()}_${archivo.name}`;
      const path = `${entidadTipo}/${entidadId}/${nombreUnico}`;
      const storageRef = ref(storage, path);

      // Subir archivo
      const uploadTask = uploadBytesResumable(storageRef, archivo);
      
      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            resolve({ success: false, progreso: progress });
          },
          (error) => {
            resolve({ success: false, error: error.message });
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);

              // Crear documento en Firestore
              const documentoData = {
                nombre: data.nombre || archivo.name,
                url,
                tipo: data.tipo,
                entidadTipo,
                entidadId,
                fechaSubida: serverTimestamp(),
                subidoPor,
                visibilidad: data.visibilidad || 'admin',
                descripcion: data.descripcion || '',
                tamaño: archivo.size,
                mimeType: archivo.type,
                metadata: {
                  width: metadata.metadata?.width || null,
                  height: metadata.metadata?.height || null
                }
              };

              const documento = await FirestoreService.create<Documento>(
                DOCUMENTO_COLECCION,
                documentoData
              );

              resolve({ success: true, documento });
            } catch (error) {
              resolve({ success: false, error: error.message });
            }
          }
        );
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Comprimir imagen
  static async comprimirImagen(archivo: File): Promise<File> {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    try {
      return await imageCompression(archivo, options);
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      return archivo;
    }
  }

  // Eliminar documento
  static async eliminarDocumento(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const documento = await FirestoreService.getById<Documento>(DOCUMENTO_COLECCION, id);
      if (!documento) {
        return { success: false, error: 'Documento no encontrado' };
      }

      // Eliminar de Storage
      try {
        const storageRef = ref(storage, documento.url);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn('Error al eliminar de Storage:', error);
        // Continuar con la eliminación de Firestore
      }

      // Eliminar de Firestore
      await FirestoreService.delete(DOCUMENTO_COLECCION, id);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Actualizar metadatos del documento
  static async actualizarDocumento(
    id: string,
    data: { nombre?: string; visibilidad?: string; descripcion?: string; tipo?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await FirestoreService.update(DOCUMENTO_COLECCION, id, {
        ...data,
        fechaActualizacion: serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Múltiples documentos
  static async subirMultiplesDocumentos(
    archivos: File[],
    entidadTipo: 'local' | 'inquilino' | 'contrato' | 'pago',
    entidadId: string,
    subidoPor: string,
    dataBase: Partial<DocumentoFormData> = {}
  ): Promise<{ success: boolean; documentos?: Documento[]; errores: any[] }> {
    const resultados = [];
    const errores = [];

    for (const archivo of archivos) {
      const data: DocumentoFormData = {
        nombre: archivo.name,
        tipo: dataBase.tipo || 'otro',
        visibilidad: dataBase.visibilidad || 'admin',
        descripcion: dataBase.descripcion || '',
        archivo
      };

      const result = await this.subirDocumento(data, entidadTipo, entidadId, subidoPor);
      if (result.success && result.documento) {
        resultados.push(result.documento);
      } else {
        errores.push({ archivo: archivo.name, error: result.error });
      }
    }

    return {
      success: resultados.length > 0,
      documentos: resultados,
      errores
    };
  }

  // Obtener estadísticas
  static async getStats(entidadTipo?: string, entidadId?: string): Promise<DocumentoStats> {
    let documentos;
    
    if (entidadTipo && entidadId) {
      documentos = await this.getDocumentosPorEntidad(entidadTipo, entidadId);
    } else {
      documentos = await this.getDocumentos();
    }

    const porTipo: Record<string, number> = {};
    const porEntidad: Record<string, number> = {};
    let totalSize = 0;
    let ultimaSubida: Date | null = null;

    documentos.forEach(doc => {
      // Por tipo
      porTipo[doc.tipo] = (porTipo[doc.tipo] || 0) + 1;
      
      // Por entidad
      const key = `${doc.entidadTipo}:${doc.entidadId}`;
      porEntidad[key] = (porEntidad[key] || 0) + 1;
      
      totalSize += doc.tamaño || 0;
      
      if (!ultimaSubida || doc.fechaSubida > ultimaSubida) {
        ultimaSubida = doc.fechaSubida;
      }
    });

    return {
      total: documentos.length,
      porTipo,
      porEntidad,
      totalSize,
      ultimaSubida
    };
  }

  // Obtener documentos visibles para un usuario
  static async getDocumentosVisibles(uid: string, rol: string): Promise<Documento[]> {
    let documentos = await this.getDocumentos();
    
    if (rol === 'admin') {
      return documentos;
    }
    
    if (rol === 'cobrador') {
      return documentos.filter(d => d.visibilidad !== 'admin');
    }
    
    if (rol === 'inquilino') {
      // Obtener inquilino asociado al usuario
      const usuarios = await FirestoreService.getAll<any>('usuarios', [
        where('uid', '==', uid)
      ]);
      
      if (usuarios.length === 0) return [];
      
      const inquilinoId = usuarios[0].inquilinoId;
      if (!inquilinoId) return [];
      
      // Documentos del inquilino o públicos
      return documentos.filter(d => 
        d.visibilidad === 'publico' || 
        (d.visibilidad === 'inquilino' && d.entidadId === inquilinoId)
      );
    }
    
    return [];
  }

  // Escuchar documentos en tiempo real
  static listenToDocumentos(
    callback: (documentos: Documento[]) => void,
    filtros?: DocumentoFiltros
  ) {
    const constraints = [];
    
    if (filtros?.entidadTipo) {
      constraints.push(where('entidadTipo', '==', filtros.entidadTipo));
    }
    
    if (filtros?.entidadId) {
      constraints.push(where('entidadId', '==', filtros.entidadId));
    }
    
    constraints.push(orderBy('fechaSubida', 'desc'));
    
    return FirestoreService.listenToCollection<Documento>(
      DOCUMENTO_COLECCION,
      callback,
      constraints
    );
  }

  // Obtener URL de thumbnail
  static getThumbnailUrl(url: string, size: number = 200): string {
    // Para Firebase Storage, se puede usar el parámetro 'alt=media&token'
    // o generar un thumbnail en el cliente
    return url;
  }

  // Obtener icono según tipo de archivo
  static getFileIcon(tipo: string): string {
    const iconMap: Record<string, string> = {
      'plano': '📐',
      'foto': '📸',
      'inspeccion': '🔍',
      'contrato': '📄',
      'identificacion': '🪪',
      'domicilio': '🏠',
      'referencia': '📋',
      'recibo': '🧾',
      'otro': '📎'
    };
    return iconMap[tipo] || '📎';
  }

  // Formatear tamaño de archivo
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
import { useState, useEffect, useCallback } from 'react';
import { DocumentosService } from '../services/documentosService';
import { Documento, DocumentoFormData, DocumentoFiltros, DocumentoStats } from '../types/documentos';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useDocumentos(filtrosIniciales?: DocumentoFiltros) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<DocumentoFiltros>(filtrosIniciales || {});
  const [stats, setStats] = useState<DocumentoStats | null>(null);
  const { user } = useAuth();

  // Cargar documentos
  const cargarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      
      if (user?.rol === 'admin') {
        data = await DocumentosService.getDocumentos(filtros);
      } else {
        data = await DocumentosService.getDocumentosVisibles(user?.uid || '', user?.rol || '');
      }
      
      setDocumentos(data);
      
      // Cargar estadísticas
      if (filtros.entidadTipo && filtros.entidadId) {
        const statsData = await DocumentosService.getStats(
          filtros.entidadTipo,
          filtros.entidadId
        );
        setStats(statsData);
      }
    } catch (err) {
      setError('Error al cargar documentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros, user]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user) return;

    let unsubscribe;
    
    if (user.rol === 'admin') {
      unsubscribe = DocumentosService.listenToDocumentos(
        (data) => {
          setDocumentos(data);
          setLoading(false);
        },
        filtros
      );
    } else {
      // Para usuarios no admin, cargar manualmente
      cargarDocumentos();
      const interval = setInterval(cargarDocumentos, 30000);
      return () => clearInterval(interval);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [filtros, user, cargarDocumentos]);

  // Subir documento
  const subirDocumento = async (
    archivo: File,
    entidadTipo: 'local' | 'inquilino' | 'contrato' | 'pago',
    entidadId: string,
    data: Partial<DocumentoFormData> = {}
  ) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const formData: DocumentoFormData = {
        nombre: data.nombre || archivo.name,
        tipo: data.tipo || 'otro',
        visibilidad: data.visibilidad || 'admin',
        descripcion: data.descripcion || '',
        archivo
      };

      const result = await DocumentosService.subirDocumento(
        formData,
        entidadTipo,
        entidadId,
        user.uid
      );

      if (result.success) {
        toast.success('Documento subido exitosamente');
        await cargarDocumentos();
        return result.documento;
      } else {
        toast.error(result.error || 'Error al subir el documento');
        return null;
      }
    } catch (err) {
      toast.error('Error al subir el documento');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Subir múltiples documentos
  const subirMultiplesDocumentos = async (
    archivos: File[],
    entidadTipo: 'local' | 'inquilino' | 'contrato' | 'pago',
    entidadId: string,
    data: Partial<DocumentoFormData> = {}
  ) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const result = await DocumentosService.subirMultiplesDocumentos(
        archivos,
        entidadTipo,
        entidadId,
        user.uid,
        data
      );

      if (result.success) {
        toast.success(`${result.documentos?.length || 0} documentos subidos exitosamente`);
        await cargarDocumentos();
        return result.documentos;
      } else {
        toast.error(`Error: ${result.errores.length} archivos no se pudieron subir`);
        return null;
      }
    } catch (err) {
      toast.error('Error al subir documentos');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar documento
  const eliminarDocumento = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      setLoading(true);
      const result = await DocumentosService.eliminarDocumento(id);
      
      if (result.success) {
        toast.success('Documento eliminado exitosamente');
        await cargarDocumentos();
      } else {
        toast.error(result.error || 'Error al eliminar el documento');
      }
    } catch (err) {
      toast.error('Error al eliminar el documento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar documento
  const actualizarDocumento = async (
    id: string,
    data: { nombre?: string; visibilidad?: string; descripcion?: string; tipo?: string }
  ) => {
    try {
      setLoading(true);
      const result = await DocumentosService.actualizarDocumento(id, data);
      
      if (result.success) {
        toast.success('Documento actualizado exitosamente');
        await cargarDocumentos();
      } else {
        toast.error(result.error || 'Error al actualizar el documento');
      }
    } catch (err) {
      toast.error('Error al actualizar el documento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar documentos
  const filtrarDocumentos = useCallback((nuevosFiltros: Partial<DocumentoFiltros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // Obtener estadísticas
  const getStats = useCallback(async (entidadTipo?: string, entidadId?: string) => {
    try {
      return await DocumentosService.getStats(entidadTipo, entidadId);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, []);

  return {
    documentos,
    loading,
    error,
    filtros,
    stats,
    subirDocumento,
    subirMultiplesDocumentos,
    eliminarDocumento,
    actualizarDocumento,
    filtrarDocumentos,
    getStats,
    cargarDocumentos
  };
}
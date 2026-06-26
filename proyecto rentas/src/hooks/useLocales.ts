import { useState, useEffect, useCallback } from 'react';
import { LocalesService } from '../services/localesService';
import { Local, LocalFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useLocales() {
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    tipo: 'todos',
    busqueda: ''
  });
  const { user } = useAuth();

  // Cargar locales
  const cargarLocales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LocalesService.getLocales(filtros);
      setLocales(data);
    } catch (err) {
      setError('Error al cargar los locales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = LocalesService.listenToLocales(
      (data) => {
        setLocales(data);
        setLoading(false);
      },
      {
        estado: filtros.estado !== 'todos' ? filtros.estado : undefined,
        tipo: filtros.tipo !== 'todos' ? filtros.tipo : undefined
      }
    );

    return () => unsubscribe();
  }, [filtros.estado, filtros.tipo]);

  // Crear local
  const crearLocal = async (data: LocalFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const nuevoLocal = await LocalesService.createLocal(data, user.uid);
      toast.success('Local creado exitosamente');
      return nuevoLocal;
    } catch (err) {
      toast.error('Error al crear el local');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar local
  const actualizarLocal = async (id: string, data: Partial<LocalFormData>) => {
    try {
      setLoading(true);
      await LocalesService.updateLocal(id, data);
      toast.success('Local actualizado exitosamente');
    } catch (err) {
      toast.error('Error al actualizar el local');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar local
  const eliminarLocal = async (id: string) => {
    try {
      setLoading(true);
      const result = await LocalesService.deleteLocal(id);
      if (result.success) {
        toast.success('Local eliminado exitosamente');
      } else {
        toast.error(result.error || 'Error al eliminar el local');
      }
    } catch (err) {
      toast.error('Error al eliminar el local');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado
  const cambiarEstado = async (id: string, nuevoEstado: 'ocupado' | 'disponible' | 'mantenimiento') => {
    try {
      setLoading(true);
      const result = await LocalesService.cambiarEstado(id, nuevoEstado);
      if (result.success) {
        toast.success(`Estado cambiado a ${nuevoEstado}`);
      } else {
        toast.error(result.error || 'Error al cambiar el estado');
      }
    } catch (err) {
      toast.error('Error al cambiar el estado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subir documento
  const subirDocumento = async (
    localId: string,
    archivo: File,
    visibilidad: 'admin' | 'inquilino' | 'publico'
  ) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const documento = await LocalesService.subirDocumento(
        localId,
        archivo,
        visibilidad,
        user.uid
      );
      toast.success('Documento subido exitosamente');
      return documento;
    } catch (err) {
      toast.error('Error al subir el documento');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar documento
  const eliminarDocumento = async (localId: string, documentoId: string) => {
    try {
      setLoading(true);
      await LocalesService.eliminarDocumento(localId, documentoId);
      toast.success('Documento eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el documento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener contrato actual
  const obtenerContratoActual = useCallback(async (localId: string) => {
    try {
      return await LocalesService.getContratoActual(localId);
    } catch (err) {
      console.error('Error al obtener el contrato actual:', err);
      return null;
    }
  }, []);

  // Filtrar locales
  const filtrarLocales = useCallback((nuevosFiltros: Partial<typeof filtros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(() => {
    const total = locales.length;
    const ocupados = locales.filter(l => l.estado === 'ocupado').length;
    const disponibles = locales.filter(l => l.estado === 'disponible').length;
    const mantenimiento = locales.filter(l => l.estado === 'mantenimiento').length;
    const ocupacion = total > 0 ? Math.round((ocupados / total) * 100) : 0;

    return {
      total,
      ocupados,
      disponibles,
      mantenimiento,
      ocupacion
    };
  }, [locales]);

  return {
    locales,
    loading,
    error,
    filtros,
    cargarLocales,
    crearLocal,
    actualizarLocal,
    eliminarLocal,
    cambiarEstado,
    subirDocumento,
    eliminarDocumento,
    obtenerContratoActual,
    filtrarLocales,
    getEstadisticas
  };
}
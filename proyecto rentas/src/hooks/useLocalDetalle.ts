import { useState, useEffect, useCallback } from 'react';
import { LocalesService } from '../services/localesService';
import { Local, Documento } from '../types';

export function useLocalDetalle(localId: string) {
  const [local, setLocal] = useState<Local | null>(null);
  const [contratoActual, setContratoActual] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del local
  const cargarDatos = useCallback(async () => {
    if (!localId) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener local
      const localData = await LocalesService.getLocalById(localId);
      if (!localData) {
        setError('Local no encontrado');
        return;
      }
      setLocal(localData);

      // Obtener contrato actual
      const contrato = await LocalesService.getContratoActual(localId);
      setContratoActual(contrato);

      // Obtener historial de ocupantes
      const historialData = await LocalesService.getHistorialOcupantes(localId);
      setHistorial(historialData);
    } catch (err) {
      setError('Error al cargar los datos del local');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [localId]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!localId) return;

    const unsubscribe = LocalesService.listenToLocal(localId, (data) => {
      setLocal(data);
    });

    return () => unsubscribe();
  }, [localId]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actualizar local
  const actualizarLocal = async (data: any) => {
    try {
      await LocalesService.updateLocal(localId, data);
      await cargarDatos();
    } catch (err) {
      console.error('Error al actualizar:', err);
      throw err;
    }
  };

  // Cambiar estado
  const cambiarEstado = async (nuevoEstado: 'ocupado' | 'disponible' | 'mantenimiento') => {
    const result = await LocalesService.cambiarEstado(localId, nuevoEstado);
    if (result.success) {
      await cargarDatos();
    }
    return result;
  };

  // Subir documento
  const subirDocumento = async (archivo: File, visibilidad: 'admin' | 'inquilino' | 'publico') => {
    try {
      const documento = await LocalesService.subirDocumento(localId, archivo, visibilidad, '');
      await cargarDatos();
      return documento;
    } catch (err) {
      console.error('Error al subir documento:', err);
      throw err;
    }
  };

  // Eliminar documento
  const eliminarDocumento = async (documentoId: string) => {
    try {
      await LocalesService.eliminarDocumento(localId, documentoId);
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      throw err;
    }
  };

  return {
    local,
    contratoActual,
    historial,
    loading,
    error,
    actualizarLocal,
    cambiarEstado,
    subirDocumento,
    eliminarDocumento,
    recargar: cargarDatos
  };
}
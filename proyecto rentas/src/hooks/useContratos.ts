import { useState, useEffect, useCallback } from 'react';
import { ContratosService } from '../services/contratosService';
import { Contrato, ContratoFormData, ContratoFilters } from '../types/contrato';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<ContratoFilters>({
    estado: 'todos'
  });
  const { user } = useAuth();

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = ContratosService.listenToContratos(
      (data) => {
        setContratos(data);
        setLoading(false);
      },
      filtros
    );

    return () => unsubscribe();
  }, [filtros]);

  // Crear contrato
  const crearContrato = async (data: ContratoFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const result = await ContratosService.createContrato(data, user.uid);
      
      if (result.success) {
        toast.success('Contrato creado exitosamente');
        return result.contrato;
      } else {
        toast.error(result.error || 'Error al crear el contrato');
        return null;
      }
    } catch (err) {
      toast.error('Error al crear el contrato');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar contrato
  const actualizarContrato = async (id: string, data: Partial<ContratoFormData>) => {
    try {
      setLoading(true);
      const result = await ContratosService.updateContrato(id, data);
      
      if (result.success) {
        toast.success('Contrato actualizado exitosamente');
      } else {
        toast.error(result.error || 'Error al actualizar el contrato');
      }
    } catch (err) {
      toast.error('Error al actualizar el contrato');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado
  const cambiarEstado = async (id: string, nuevoEstado: string, motivo?: string) => {
    try {
      setLoading(true);
      const result = await ContratosService.cambiarEstado(
        id, 
        nuevoEstado as any, 
        motivo
      );
      
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

  // Renovar contrato
  const renovarContrato = async (
    id: string,
    nuevaFechaFin: Date,
    nuevoMonto?: number,
    motivo?: string
  ) => {
    try {
      setLoading(true);
      const result = await ContratosService.renovarContrato(
        id,
        nuevaFechaFin,
        nuevoMonto,
        motivo
      );
      
      if (result.success) {
        toast.success('Contrato renovado exitosamente');
        return result.nuevoContrato;
      } else {
        toast.error(result.error || 'Error al renovar el contrato');
        return null;
      }
    } catch (err) {
      toast.error('Error al renovar el contrato');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Subir documento
  const subirDocumento = async (contratoId: string, archivo: File) => {
    try {
      setLoading(true);
      const result = await ContratosService.subirDocumentoContrato(contratoId, archivo);
      
      if (result.success) {
        toast.success('Documento subido exitosamente');
        return result.url;
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

  // Filtrar contratos
  const filtrarContratos = useCallback((nuevosFiltros: Partial<ContratoFilters>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async () => {
    try {
      return await ContratosService.getEstadisticas();
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, []);

  return {
    contratos,
    loading,
    error,
    filtros,
    crearContrato,
    actualizarContrato,
    cambiarEstado,
    renovarContrato,
    subirDocumento,
    filtrarContratos,
    getEstadisticas
  };
}
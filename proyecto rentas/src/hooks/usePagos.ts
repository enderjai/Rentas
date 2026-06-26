import { useState, useEffect, useCallback } from 'react';
import { PagosService } from '../services/pagosService';
import { Pago, PagoFormData, PagoFilters, EstadoPago, DeudaTotal } from '../types/pago';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function usePagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<PagoFilters>({});
  const { user } = useAuth();

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = PagosService.listenToPagos(
      (data) => {
        setPagos(data);
        setLoading(false);
      },
      filtros
    );

    return () => unsubscribe();
  }, [filtros]);

  // Registrar pago
  const registrarPago = async (data: PagoFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const result = await PagosService.registrarPago(data, user.uid);
      
      if (result.success) {
        toast.success('Pago registrado exitosamente');
        toast.success('Recibo PDF generado automáticamente');
        return result.pago;
      } else {
        toast.error(result.error || 'Error al registrar el pago');
        return null;
      }
    } catch (err) {
      toast.error('Error al registrar el pago');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Obtener estado de pago
  const getEstadoPago = useCallback(async (contratoId: string, mes: string) => {
    try {
      return await PagosService.getEstadoPago(contratoId, mes);
    } catch (err) {
      console.error('Error al obtener estado de pago:', err);
      return null;
    }
  }, []);

  // Obtener deuda total
  const getDeudaTotal = useCallback(async (contratoId: string) => {
    try {
      return await PagosService.getDeudaTotal(contratoId);
    } catch (err) {
      console.error('Error al obtener deuda total:', err);
      return null;
    }
  }, []);

  // Obtener morosos
  const getMorosos = useCallback(async () => {
    try {
      return await PagosService.getMorosos();
    } catch (err) {
      console.error('Error al obtener morosos:', err);
      return [];
    }
  }, []);

  // Enviar recordatorio
  const enviarRecordatorio = useCallback(async (contratoId: string, tipo: 'recordatorio' | 'atraso') => {
    try {
      const result = await PagosService.enviarRecordatorioPago(contratoId, tipo);
      if (result.success) {
        toast.success(`Recordatorio enviado exitosamente`);
      } else {
        toast.error(result.error || 'Error al enviar recordatorio');
      }
    } catch (err) {
      toast.error('Error al enviar recordatorio');
      console.error(err);
    }
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async (fechas?: { fechaInicio?: Date; fechaFin?: Date }) => {
    try {
      return await PagosService.getEstadisticas(fechas);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, []);

  // Filtrar pagos
  const filtrarPagos = useCallback((nuevosFiltros: Partial<PagoFilters>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  return {
    pagos,
    loading,
    error,
    filtros,
    registrarPago,
    getEstadoPago,
    getDeudaTotal,
    getMorosos,
    enviarRecordatorio,
    getEstadisticas,
    filtrarPagos
  };
}
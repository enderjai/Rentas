import { useState, useEffect, useCallback } from 'react';
import { PagosService } from '../services/pagosService';
import { Pago } from '../types/pago';

export function usePagoDetalle(pagoId: string) {
  const [pago, setPago] = useState<Pago | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!pagoId) return;

    const unsubscribe = PagosService.listenToPagos(
      (pagos) => {
        const pagoEncontrado = pagos.find(p => p.id === pagoId);
        setPago(pagoEncontrado || null);
        setLoading(false);
      },
      { /* filtros para buscar solo este pago */ }
    );

    return () => unsubscribe();
  }, [pagoId]);

  const recargar = useCallback(async () => {
    if (!pagoId) return;
    
    try {
      setLoading(true);
      const data = await PagosService.getPagoById(pagoId);
      setPago(data);
    } catch (err) {
      setError('Error al cargar el pago');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagoId]);

  return {
    pago,
    loading,
    error,
    recargar
  };
}
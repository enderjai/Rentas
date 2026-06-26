import { useState, useEffect, useCallback } from 'react';
import { ContratosService } from '../services/contratosService';
import { Contrato } from '../types/contrato';

export function useContratoDetalle(contratoId: string) {
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!contratoId) return;

    const unsubscribe = ContratosService.listenToContrato(contratoId, (data) => {
      setContrato(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [contratoId]);

  const recargar = useCallback(async () => {
    if (!contratoId) return;
    
    try {
      setLoading(true);
      const data = await ContratosService.getContratoById(contratoId);
      setContrato(data);
    } catch (err) {
      setError('Error al cargar el contrato');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  return {
    contrato,
    loading,
    error,
    recargar
  };
}
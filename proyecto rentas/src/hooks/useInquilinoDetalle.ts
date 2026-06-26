import { useState, useEffect, useCallback } from 'react';
import { InquilinosService } from '../services/inquilinosService';
import { Inquilino } from '../types/inquilino';

export function useInquilinoDetalle(inquilinoId: string) {
  const [inquilino, setInquilino] = useState<Inquilino | null>(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del inquilino
  const cargarDatos = useCallback(async () => {
    if (!inquilinoId) return;

    try {
      setLoading(true);
      setError(null);

      const inquilinoData = await InquilinosService.getInquilinoById(inquilinoId);
      if (!inquilinoData) {
        setError('Inquilino no encontrado');
        return;
      }
      setInquilino(inquilinoData);

      const contratosData = await InquilinosService.getContratos(inquilinoId);
      setContratos(contratosData);

      const pagosData = await InquilinosService.getHistorialPagos(inquilinoId);
      setHistorialPagos(pagosData);
    } catch (err) {
      setError('Error al cargar los datos del inquilino');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inquilinoId]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!inquilinoId) return;

    const unsubscribe = InquilinosService.listenToInquilino(inquilinoId, (data) => {
      setInquilino(data);
    });

    return () => unsubscribe();
  }, [inquilinoId]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    inquilino,
    contratos,
    historialPagos,
    loading,
    error,
    recargar: cargarDatos
  };
}
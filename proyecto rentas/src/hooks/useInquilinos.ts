import { useState, useEffect, useCallback } from 'react';
import { InquilinosService } from '../services/inquilinosService';
import { Inquilino, InquilinoFormData, InquilinoFilters } from '../types/inquilino';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useInquilinos() {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<InquilinoFilters>({
    busqueda: '',
    activo: true,
    tipo: 'todos'
  });
  const { user } = useAuth();

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = InquilinosService.listenToInquilinos(
      (data) => {
        setInquilinos(data);
        setLoading(false);
      },
      filtros
    );

    return () => unsubscribe();
  }, [filtros]);

  // Crear inquilino
  const crearInquilino = async (data: InquilinoFormData, crearUsuario: boolean = false) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setLoading(true);
      const result = await InquilinosService.createInquilino(data, crearUsuario);
      
      if (result.success) {
        toast.success('Inquilino creado exitosamente');
        if (crearUsuario) {
          toast.success('Usuario creado y enviado al correo');
        }
        return result.inquilino;
      } else {
        toast.error(result.error || 'Error al crear el inquilino');
        return null;
      }
    } catch (err) {
      toast.error('Error al crear el inquilino');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar inquilino
  const actualizarInquilino = async (id: string, data: Partial<InquilinoFormData>) => {
    try {
      setLoading(true);
      const result = await InquilinosService.updateInquilino(id, data);
      
      if (result.success) {
        toast.success('Inquilino actualizado exitosamente');
      } else {
        toast.error(result.error || 'Error al actualizar el inquilino');
      }
    } catch (err) {
      toast.error('Error al actualizar el inquilino');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar inquilino
  const eliminarInquilino = async (id: string) => {
    try {
      setLoading(true);
      const result = await InquilinosService.deleteInquilino(id);
      
      if (result.success) {
        toast.success('Inquilino eliminado exitosamente');
      } else {
        toast.error(result.error || 'Error al eliminar el inquilino');
      }
    } catch (err) {
      toast.error('Error al eliminar el inquilino');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subir documento
  const subirDocumento = async (
    inquilinoId: string,
    archivo: File,
    tipo: 'identificacion' | 'domicilio' | 'referencia' | 'otro'
  ) => {
    try {
      setLoading(true);
      const documento = await InquilinosService.subirDocumento(inquilinoId, archivo, tipo);
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
  const eliminarDocumento = async (inquilinoId: string, documentoId: string) => {
    try {
      setLoading(true);
      await InquilinosService.eliminarDocumento(inquilinoId, documentoId);
      toast.success('Documento eliminado exitosamente');
    } catch (err) {
      toast.error('Error al eliminar el documento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar inquilinos
  const filtrarInquilinos = useCallback((nuevosFiltros: Partial<InquilinoFilters>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async () => {
    try {
      return await InquilinosService.getEstadisticas();
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, []);

  // Enviar restablecimiento de contraseña
  const enviarResetPassword = async (email: string) => {
    try {
      await InquilinosService.resetPassword(email);
      toast.success('Correo de restablecimiento enviado');
    } catch (err) {
      toast.error('Error al enviar el correo');
      console.error(err);
    }
  };

  return {
    inquilinos,
    loading,
    error,
    filtros,
    crearInquilino,
    actualizarInquilino,
    eliminarInquilino,
    subirDocumento,
    eliminarDocumento,
    filtrarInquilinos,
    getEstadisticas,
    enviarResetPassword
  };
}
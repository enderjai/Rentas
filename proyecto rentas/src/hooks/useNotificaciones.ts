import { useState, useEffect, useCallback } from 'react';
import { NotificacionesService } from '../services/notificacionesService';
import { Notificacion, NotificacionFiltros, PreferenciasNotificacion } from '../types/notificaciones';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<NotificacionFiltros>({});
  const { user } = useAuth();

  // Cargar notificaciones
  const cargarNotificaciones = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await NotificacionesService.getNotificaciones({
        ...filtros,
        destinatario: user.uid
      });
      setNotificaciones(data);
      
      const noLeidasData = await NotificacionesService.getNotificacionesNoLeidas(user.uid);
      setNoLeidas(noLeidasData);
    } catch (err) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, filtros]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user) return;
    cargarNotificaciones();

    // Actualizar cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [user, cargarNotificaciones]);

  // Marcar como leída
  const marcarComoLeida = async (id: string) => {
    try {
      await NotificacionesService.marcarComoLeida(id);
      await cargarNotificaciones();
    } catch (err) {
      toast.error('Error al marcar como leída');
    }
  };

  // Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    if (!user) return;
    try {
      await NotificacionesService.marcarTodasComoLeidas(user.uid);
      await cargarNotificaciones();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (err) {
      toast.error('Error al marcar todas como leídas');
    }
  };

  // Crear notificación manual
  const crearNotificacion = async (data: Omit<Notificacion, 'id' | 'fecha' | 'leida' | 'fechaLectura'>) => {
    try {
      setLoading(true);
      const notificacion = await NotificacionesService.crearNotificacion(data);
      toast.success('Notificación enviada exitosamente');
      await cargarNotificaciones();
      return notificacion;
    } catch (err) {
      toast.error('Error al enviar notificación');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificación a morosos
  const enviarNotificacionMorosos = async (mensaje: string) => {
    try {
      setLoading(true);
      await NotificacionesService.enviarNotificacionMorosos(mensaje);
      toast.success('Notificaciones enviadas a todos los morosos');
    } catch (err) {
      toast.error('Error al enviar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas
  const getStats = useCallback(async () => {
    if (!user) return null;
    try {
      return await NotificacionesService.getStats(user.uid);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return null;
    }
  }, [user]);

  // Obtener preferencias
  const getPreferencias = useCallback(async () => {
    if (!user) return null;
    try {
      return await NotificacionesService.getPreferencias(user.uid);
    } catch (err) {
      console.error('Error al obtener preferencias:', err);
      return null;
    }
  }, [user]);

  // Actualizar preferencias
  const updatePreferencias = useCallback(async (data: Partial<PreferenciasNotificacion>) => {
    if (!user) return;
    try {
      await NotificacionesService.updatePreferencias(user.uid, data);
      toast.success('Preferencias actualizadas exitosamente');
    } catch (err) {
      toast.error('Error al actualizar preferencias');
      console.error(err);
    }
  }, [user]);

  // Filtrar notificaciones
  const filtrarNotificaciones = useCallback((nuevosFiltros: Partial<NotificacionFiltros>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  return {
    notificaciones,
    noLeidas,
    loading,
    error,
    filtros,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    crearNotificacion,
    enviarNotificacionMorosos,
    getStats,
    getPreferencias,
    updatePreferencias,
    filtrarNotificaciones
  };
}
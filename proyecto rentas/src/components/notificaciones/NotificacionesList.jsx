import React, { useState } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { TIPOS_NOTIFICACION } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export const NotificacionesList = () => {
  const { 
    notificaciones, 
    noLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas 
  } = useNotificaciones();
  const [filtro, setFiltro] = useState('todas');

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'pago_recordatorio': return <BellIcon className="h-5 w-5 text-blue-500" />;
      case 'pago_atraso': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'vencimiento': return <CalendarIcon className="h-5 w-5 text-yellow-500" />;
      case 'pago_recibo': return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      default: return <EnvelopeIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTipoLabel = (tipo) => {
    return TIPOS_NOTIFICACION.find(t => t.value === tipo)?.label || tipo;
  };

  const notificacionesFiltradas = filtro === 'todas' 
    ? notificaciones 
    : filtro === 'no_leidas' 
      ? notificaciones.filter(n => !n.leida)
      : notificaciones.filter(n => n.tipo === filtro);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
          <p className="text-sm text-gray-500">
            {noLeidas.length} no leídas • {notificaciones.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {noLeidas.length > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-3 py-1 rounded-full text-sm ${
            filtro === 'todas' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro('no_leidas')}
          className={`px-3 py-1 rounded-full text-sm ${
            filtro === 'no_leidas' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          No leídas ({noLeidas.length})
        </button>
        {TIPOS_NOTIFICACION.map(tipo => (
          <button
            key={tipo.value}
            onClick={() => setFiltro(tipo.value)}
            className={`px-3 py-1 rounded-full text-sm ${
              filtro === tipo.value 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tipo.icon} {tipo.label}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-2">
        {notificacionesFiltradas.map(notificacion => (
          <div
            key={notificacion.id}
            className={`p-4 rounded-lg border transition-all ${
              notificacion.leida 
                ? 'bg-white border-gray-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getIcon(notificacion.tipo)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className={`font-medium ${
                      notificacion.leida ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notificacion.titulo}
                    </h4>
                    <p className="text-sm text-gray-600">{notificacion.mensaje}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {format(new Date(notificacion.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                    {!notificacion.leida && (
                      <button
                        onClick={() => marcarComoLeida(notificacion.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                    {getTipoLabel(notificacion.tipo)}
                  </span>
                  {notificacion.canal && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                      {notificacion.canal.toUpperCase()}
                    </span>
                  )}
                  {notificacion.enlace && (
                    <a
                      href={notificacion.enlace}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ver detalles →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {notificacionesFiltradas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
};
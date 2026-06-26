import React, { useState, useEffect } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { TIPOS_NOTIFICACION, CANALES_NOTIFICACION } from '../../utils/constants';

export const PreferenciasNotificaciones = () => {
  const { getPreferencias, updatePreferencias } = useNotificaciones();
  const [preferencias, setPreferencias] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const data = await getPreferencias();
      if (data) {
        setPreferencias(data);
      }
      setLoading(false);
    };
    cargar();
  }, []);

  const handleToggle = async (campo, valor) => {
    if (!preferencias) return;
    
    const nuevasPreferencias = { ...preferencias };
    
    if (campo.includes('.')) {
      const [parent, child] = campo.split('.');
      nuevasPreferencias[parent][child] = valor;
    } else {
      nuevasPreferencias[campo] = valor;
    }
    
    setPreferencias(nuevasPreferencias);
    await updatePreferencias(nuevasPreferencias);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferencias) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron preferencias</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Preferencias de Notificaciones</h3>

      {/* Canales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-4">Canales de Notificación</h4>
        <div className="space-y-3">
          {CANALES_NOTIFICACION.map(canal => (
            <label key={canal.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferencias.canales[canal.value] || false}
                onChange={(e) => handleToggle(`canales.${canal.value}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={canal.value === 'inapp'}
              />
              <span className="text-sm text-gray-700">
                {canal.icon} {canal.label}
                {canal.value === 'inapp' && ' (Siempre activo)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipos de Notificaciones */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-4">Tipos de Notificaciones</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TIPOS_NOTIFICACION.map(tipo => (
            <label key={tipo.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferencias.tipos[tipo.value] || false}
                onChange={(e) => handleToggle(`tipos.${tipo.value}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {tipo.icon} {tipo.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Días de Anticipación */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-4">Días de Anticipación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recordatorio de Pago
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={preferencias.diasAnticipacion?.pago || 3}
              onChange={(e) => handleToggle('diasAnticipacion.pago', parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-500">días antes</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recordatorio de Vencimiento
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={preferencias.diasAnticipacion?.vencimiento || 30}
              onChange={(e) => handleToggle('diasAnticipacion.vencimiento', parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-500">días antes</span>
          </div>
        </div>
      </div>

      {/* Email Personalizado */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-4">Personalización de Email</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asunto Personalizado
            </label>
            <input
              type="text"
              value={preferencias.emailPersonalizado?.asunto || ''}
              onChange={(e) => handleToggle('emailPersonalizado.asunto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Asunto del email..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje Personalizado
            </label>
            <textarea
              value={preferencias.emailPersonalizado?.mensaje || ''}
              onChange={(e) => handleToggle('emailPersonalizado.mensaje', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mensaje personalizado para emails..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
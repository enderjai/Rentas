import React, { useState } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { TIPOS_NOTIFICACION } from '../../utils/constants';

export const EnviarNotificacionManual = ({ onEnviado }) => {
  const { crearNotificacion, enviarNotificacionMorosos } = useNotificaciones();
  const [formData, setFormData] = useState({
    destinatario: '',
    destinatarioEmail: '',
    tipo: 'general',
    titulo: '',
    mensaje: '',
    enlace: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [enviarMorosos, setEnviarMorosos] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.titulo || !formData.mensaje) {
      setError('El título y mensaje son requeridos');
      return;
    }

    setEnviando(true);

    try {
      if (enviarMorosos) {
        await enviarNotificacionMorosos(formData.mensaje);
      } else {
        await crearNotificacion({
          ...formData,
          canal: 'all'
        });
      }
      
      onEnviado?.();
      setFormData({
        destinatario: '',
        destinatarioEmail: '',
        tipo: 'general',
        titulo: '',
        mensaje: '',
        enlace: ''
      });
      setEnviarMorosos(false);
    } catch (err) {
      setError(err.message || 'Error al enviar notificación');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enviarMorosos}
            onChange={(e) => setEnviarMorosos(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enviar a todos los morosos</span>
        </label>
      </div>

      {!enviarMorosos && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinatario (UID)
              </label>
              <input
                type="text"
                value={formData.destinatario}
                onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="UID del usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email del Destinatario
              </label>
              <input
                type="email"
                value={formData.destinatarioEmail}
                onChange={(e) => setFormData({ ...formData, destinatarioEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Notificación
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPOS_NOTIFICACION.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Título de la notificación"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje *
        </label>
        <textarea
          value={formData.mensaje}
          onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mensaje de la notificación..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enlace (opcional)
        </label>
        <input
          type="text"
          value={formData.enlace}
          onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="/ruta/enlace"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : enviarMorosos ? 'Enviar a Morosos' : 'Enviar Notificación'}
      </button>
    </form>
  );
};
import React, { useState } from 'react';
import { useLocalDetalle } from '../../hooks/useLocalDetalle';
import { useAuth } from '../../contexts/AuthContext';
import { LOCAL_ESTADOS, LOCAL_TIPOS } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const LocalDetail = ({ localId, onBack }) => {
  const { 
    local, 
    contratoActual, 
    historial, 
    loading, 
    subirDocumento,
    eliminarDocumento,
    cambiarEstado
  } = useLocalDetalle(localId);
  const { isAdmin, isCobrador } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedVisibilidad, setSelectedVisibilidad] = useState('admin');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Local no encontrado</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          Volver
        </button>
      </div>
    );
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await subirDocumento(file, selectedVisibilidad);
      toast.success('Documento subido exitosamente');
    } catch (error) {
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentoId) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      try {
        await eliminarDocumento(documentoId);
        toast.success('Documento eliminado');
      } catch (error) {
        toast.error('Error al eliminar el documento');
      }
    }
  };

  const handleChangeStatus = async (newStatus) => {
    const result = await cambiarEstado(newStatus);
    if (result.success) {
      toast.success(`Estado cambiado a ${newStatus}`);
    } else {
      toast.error(result.error || 'Error al cambiar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{local.nombre}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${LOCAL_ESTADOS.find(e => e.value === local.estado)?.color}`}>
            {LOCAL_ESTADOS.find(e => e.value === local.estado)?.label}
          </span>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <select
              onChange={(e) => handleChangeStatus(e.target.value)}
              value={local.estado}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {LOCAL_ESTADOS.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Información General</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-xs text-gray-500">Tipo</dt>
              <dd className="text-sm font-medium">{LOCAL_TIPOS.find(t => t.value === local.tipo)?.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Área</dt>
              <dd className="text-sm font-medium">{local.metros} m²</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Dirección</dt>
              <dd className="text-sm">{local.direccion}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
          <p className="text-sm text-gray-700">{local.descripcion || 'Sin descripción'}</p>
        </div>
      </div>

      {/* Contrato actual */}
      {contratoActual && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contrato Actual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Inquilino</p>
              <p className="font-medium">{contratoActual.inquilino?.nombre || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Renta Mensual</p>
              <p className="font-medium text-green-600">${contratoActual.montoRenta?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-sm">
                {format(new Date(contratoActual.fechaInicio), 'dd/MM/yyyy', { locale: es })} - 
                {format(new Date(contratoActual.fechaFin), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Día de Pago</p>
              <p className="font-medium">Día {contratoActual.diaPago}</p>
            </div>
          </div>
        </div>
      )}

      {/* Historial de ocupantes */}
      {historial.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Ocupantes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Inquilino</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historial.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.inquilinoNombre || 'Desconocido'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {format(new Date(item.fechaInicio), 'dd/MM/yyyy', { locale: es })} -
                      {item.fechaFin ? format(new Date(item.fechaFin), 'dd/MM/yyyy', { locale: es }) : 'Actual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Documentos</h3>
          {(isAdmin || isCobrador) && (
            <div className="flex items-center gap-4">
              <select
                value={selectedVisibilidad}
                onChange={(e) => setSelectedVisibilidad(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="admin">Solo Administradores</option>
                <option value="inquilino">Inquilino</option>
                <option value="publico">Público</option>
              </select>
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </span>
              </label>
            </div>
          )}
        </div>

        {local.documentos && local.documentos.length > 0 ? (
          <div className="space-y-2">
            {local.documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{doc.nombre}</p>
                    <p className="text-xs text-gray-500">
                      Subido: {format(new Date(doc.fechaSubida), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {doc.visibilidad}
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver
                  </a>
                  {(isAdmin || isCobrador) && (
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay documentos asociados</p>
        )}
      </div>
    </div>
  );
};
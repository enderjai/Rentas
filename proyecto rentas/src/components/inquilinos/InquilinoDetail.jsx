import React, { useState } from 'react';
import { useInquilinoDetalle } from '../../hooks/useInquilinoDetalle';
import { useAuth } from '../../contexts/AuthContext';
import { DOCUMENTO_TIPOS } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { InquilinosService } from '../../services/inquilinosService';

export const InquilinoDetail = ({ inquilinoId, onBack }) => {
  const { 
    inquilino, 
    contratos, 
    historialPagos, 
    loading,
    recargar 
  } = useInquilinoDetalle(inquilinoId);
  const { isAdmin, isCobrador, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('identificacion');
  const [enviandoReset, setEnviandoReset] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await InquilinosService.subirDocumento(inquilinoId, file, selectedTipo);
      toast.success('Documento subido exitosamente');
      await recargar();
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
        await InquilinosService.eliminarDocumento(inquilinoId, documentoId);
        toast.success('Documento eliminado');
        await recargar();
      } catch (error) {
        toast.error('Error al eliminar el documento');
      }
    }
  };

  const handleSendResetPassword = async () => {
    if (!inquilino?.email) return;
    
    if (window.confirm(`¿Enviar correo de restablecimiento a ${inquilino.email}?`)) {
      setEnviandoReset(true);
      try {
        await InquilinosService.resetPassword(inquilino.email);
        toast.success('Correo de restablecimiento enviado');
      } catch (error) {
        toast.error('Error al enviar el correo');
      } finally {
        setEnviandoReset(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!inquilino) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inquilino no encontrado</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{inquilino.nombre}</h2>
            <p className="text-sm text-gray-500">
              {inquilino.tipo === 'persona' ? 'Persona Física' : 'Empresa'} • 
              RFC: {inquilino.rfc}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            inquilino.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {inquilino.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        {isAdmin && inquilino.userId && (
          <button
            onClick={handleSendResetPassword}
            disabled={enviandoReset}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <EnvelopeIcon className="h-4 w-4 inline mr-2" />
            {enviandoReset ? 'Enviando...' : 'Restablecer Contraseña'}
          </button>
        )}
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Información de Contacto</h3>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
              <span>{inquilino.email}</span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <PhoneIcon className="h-4 w-4 text-gray-400" />
              <span>{inquilino.telefono}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Contacto de Emergencia</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium">{inquilino.contactoEmergencia?.nombre || 'N/A'}</p>
            <p className="text-sm text-gray-600">{inquilino.contactoEmergencia?.telefono || 'N/A'}</p>
            <p className="text-xs text-gray-500">{inquilino.contactoEmergencia?.parentesco || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Local Actual</h3>
          {inquilino.localActual ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <HomeIcon className="h-4 w-4" />
                <span>{inquilino.localNombre || 'Cargando...'}</span>
              </p>
              {inquilino.contratoActual && (
                <p className="text-xs text-gray-500">
                  Contrato vigente desde {format(new Date(inquilino.contratoActual.fechaInicio), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sin local asignado</p>
          )}
        </div>
      </div>

      {/* Contratos */}
      {contratos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contratos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Local</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Período</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Renta</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contratos.map((contrato) => (
                  <tr key={contrato.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{contrato.localNombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {format(new Date(contrato.fechaInicio), 'dd/MM/yyyy', { locale: es })} -
                      {format(new Date(contrato.fechaFin), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">
                      ${contrato.montoRenta?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contrato.estado === 'vigente' ? 'bg-green-100 text-green-700' :
                        contrato.estado === 'finalizado' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {contrato.estado?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de Pagos */}
      {historialPagos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Pagos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Monto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Método</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historialPagos.slice(0, 10).map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {format(new Date(pago.fechaPago), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">
                      ${pago.monto?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{pago.metodo || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{pago.mesCorrespondiente || 'N/A'}</td>
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
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                {DOCUMENTO_TIPOS.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
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

        {inquilino.documentos && inquilino.documentos.length > 0 ? (
          <div className="space-y-2">
            {inquilino.documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{doc.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {DOCUMENTO_TIPOS.find(t => t.value === doc.tipo)?.label || doc.tipo} • 
                      Subido: {format(new Date(doc.fechaSubida), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
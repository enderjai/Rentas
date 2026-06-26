import React, { useState } from 'react';
import { useContratoDetalle } from '../../hooks/useContratoDetalle';
import { useAuth } from '../../contexts/AuthContext';
import { CONTRATO_ESTADOS, FORMAS_PAGO } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ContratosService } from '../../services/contratosService';

export const ContratoDetail = ({ contratoId, onBack }) => {
  const { contrato, loading, recargar } = useContratoDetalle(contratoId);
  const { isAdmin, isInquilino } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [editando, setEditando] = useState(false);

  const handleUploadDocumento = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    setUploading(true);
    try {
      const result = await ContratosService.subirDocumentoContrato(contratoId, file);
      if (result.success) {
        toast.success('Documento subido exitosamente');
        await recargar();
      } else {
        toast.error(result.error || 'Error al subir el documento');
      }
    } catch (error) {
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) return;
    
    let motivo = '';
    if (nuevoEstado === 'rescindido') {
      motivo = prompt('Motivo de la rescisión:') || '';
      if (motivo === null) return;
    }
    
    const result = await ContratosService.cambiarEstado(contratoId, nuevoEstado, motivo);
    if (result.success) {
      toast.success(`Estado cambiado a ${nuevoEstado}`);
      await recargar();
    } else {
      toast.error(result.error || 'Error al cambiar el estado');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contrato no encontrado</p>
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
            <h2 className="text-2xl font-bold text-gray-800">
              Contrato {contrato.localNombre}
            </h2>
            <p className="text-sm text-gray-500">
              {contrato.inquilinoNombre} • {format(new Date(contrato.fechaInicio), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            CONTRATO_ESTADOS.find(e => e.value === contrato.estado)?.color
          }`}>
            {CONTRATO_ESTADOS.find(e => e.value === contrato.estado)?.label}
          </span>
        </div>
        {isAdmin && contrato.estado === 'vigente' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleCambiarEstado('rescindido')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Rescindir
            </button>
            <button
              onClick={() => {
                const nuevaFecha = prompt('Nueva fecha de fin (YYYY-MM-DD):', 
                  format(new Date(contrato.fechaFin), 'yyyy-MM-dd'));
                if (nuevaFecha) {
                  const nuevoMonto = prompt('Nuevo monto de renta:', contrato.montoRenta);
                  if (nuevoMonto !== null) {
                    // Implementar renovación
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Renovar
            </button>
          </div>
        )}
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Información del Local</h3>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <HomeIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{contrato.localNombre}</span>
            </p>
            <p className="text-sm text-gray-600">ID: {contrato.localId}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Información del Inquilino</h3>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{contrato.inquilinoNombre}</span>
            </p>
            <p className="text-sm text-gray-600">ID: {contrato.inquilinoId}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Detalles Financieros</h3>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-green-600">
                ${contrato.montoRenta?.toLocaleString() || 0} / mes
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Depósito: ${contrato.depositoGarantia?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-600">
              Forma de pago: {FORMAS_PAGO.find(f => f.value === contrato.formaPago)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Período y estado de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Período del Contrato</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                Inicio: {format(new Date(contrato.fechaInicio), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                Fin: {format(new Date(contrato.fechaFin), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            {contrato.diasRestantes > 0 && contrato.estado === 'vigente' && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏰ {contrato.diasRestantes} días restantes
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Estado de Pagos</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado del mes:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                contrato.estadoPago === 'pagado' ? 'bg-green-100 text-green-700' :
                contrato.estadoPago === 'atrasado' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {contrato.estadoPago?.toUpperCase() || 'PENDIENTE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total pagado:</span>
              <span className="text-sm font-medium text-green-600">
                ${contrato.totalPagado?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Meses pagados:</span>
              <span className="text-sm font-medium">
                {contrato.mesesPagados || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cláusulas */}
      {contrato.clausulas && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Cláusulas Especiales</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contrato.clausulas}</p>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Documento del Contrato</h3>
          {isAdmin && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleUploadDocumento}
                className="hidden"
                disabled={uploading}
              />
              <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                <DocumentArrowUpIcon className="h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Subir Contrato PDF'}
              </span>
            </label>
          )}
        </div>

        {contrato.documentoUrl ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Contrato Firmado</p>
                <p className="text-xs text-gray-500">
                  Subido el {format(new Date(contrato.fechaActualizacion), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            </div>
            <a
              href={contrato.documentoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
            >
              Ver PDF
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay documento asociado</p>
        )}
      </div>

      {/* Historial de renovaciones */}
      {contrato.renovaciones && contrato.renovaciones.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Renovaciones</h3>
          <div className="space-y-2">
            {contrato.renovaciones.map((renovacion, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(renovacion.fecha), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Nuevo monto:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ${renovacion.nuevoMonto?.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Nueva fecha fin:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(renovacion.nuevoFin), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Motivo:</span>
                    <span className="ml-2">{renovacion.motivo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
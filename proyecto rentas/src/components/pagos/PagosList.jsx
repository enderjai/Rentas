import React, { useState } from 'react';
import { usePagos } from '../../hooks/usePagos';
import { METODOS_PAGO } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export const PagosList = ({ onRegister, onViewDetails }) => {
  const { 
    pagos, 
    loading, 
    filtros, 
    filtrarPagos,
    getEstadisticas
  } = usePagos();
  const { isAdmin, isCobrador } = useAuth();
  const [showFiltros, setShowFiltros] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  React.useEffect(() => {
    const cargarEstadisticas = async () => {
      const data = await getEstadisticas();
      setEstadisticas(data);
    };
    cargarEstadisticas();
  }, [pagos]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Total Pagos</p>
            <p className="text-2xl font-bold text-gray-800">{estadisticas.totalPagos}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-green-600">
              ${estadisticas.totalMonto.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Promedio</p>
            <p className="text-2xl font-bold text-blue-600">
              ${estadisticas.promedioMonto.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Método más usado</p>
            <p className="text-2xl font-bold text-purple-600">
              {Object.entries(estadisticas.pagosPorMetodo)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por local o inquilino..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <button
          onClick={() => setShowFiltros(!showFiltros)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <FunnelIcon className="h-5 w-5" />
          Filtros
        </button>

        {(isAdmin || isCobrador) && (
          <button
            onClick={onRegister}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Registrar Pago
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {showFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
            <select
              value={filtros.metodo || ''}
              onChange={(e) => filtrarPagos({ metodo: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {METODOS_PAGO.map(metodo => (
                <option key={metodo.value} value={metodo.value}>
                  {metodo.icon} {metodo.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <input
              type="month"
              value={filtros.mes || ''}
              onChange={(e) => filtrarPagos({ mes: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de pagos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local / Inquilino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagos.map(pago => (
                <tr key={pago.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {pago.numeroRecibo || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{pago.localNombre || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{pago.inquilinoNombre || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pago.mesCorrespondiente}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                    ${pago.monto.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {METODOS_PAGO.find(m => m.value === pago.metodo)?.icon || ''} {pago.metodo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(pago.fechaPago), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onViewDetails(pago.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver
                    </button>
                    {pago.comprobante && (
                      <a
                        href={pago.comprobante}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green-600 hover:text-green-800 text-sm"
                      >
                        <DocumentTextIcon className="h-4 w-4 inline" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No se encontraron pagos registrados</p>
        </div>
      )}
    </div>
  );
};
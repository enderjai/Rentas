import React, { useState } from 'react';
import { useContratos } from '../../hooks/useContratos';
import { CONTRATO_ESTADOS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export const ContratosList = ({ onEdit, onViewDetails, onCreate }) => {
  const { 
    contratos, 
    loading, 
    filtros, 
    filtrarContratos,
    cambiarEstado
  } = useContratos();
  const { isAdmin, isInquilino } = useAuth();
  const [showFiltros, setShowFiltros] = useState(false);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    if (nuevoEstado === 'rescindido') {
      const motivo = prompt('Motivo de rescisión:');
      if (motivo === null) return;
      await cambiarEstado(id, nuevoEstado, motivo);
    } else {
      await cambiarEstado(id, nuevoEstado);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoConfig = CONTRATO_ESTADOS.find(e => e.value === estado);
    return estadoConfig ? estadoConfig.color : 'bg-gray-100 text-gray-700';
  };

  const getEstadoPagoBadge = (estadoPago) => {
    const config = {
      pagado: 'bg-green-100 text-green-700',
      pendiente: 'bg-yellow-100 text-yellow-700',
      atrasado: 'bg-red-100 text-red-700'
    };
    return config[estadoPago] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por local o inquilino..."
            value={filtros.busqueda || ''}
            onChange={(e) => filtrarContratos({ busqueda: e.target.value })}
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

        {isAdmin && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Contrato
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {showFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado || 'todos'}
              onChange={(e) => filtrarContratos({ estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {CONTRATO_ESTADOS.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaInicio || ''}
              onChange={(e) => filtrarContratos({ fechaInicio: e.target.value ? new Date(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaFin || ''}
              onChange={(e) => filtrarContratos({ fechaFin: e.target.value ? new Date(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Lista de contratos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contratos.map(contrato => (
          <div key={contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {contrato.localNombre || 'Local sin nombre'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {contrato.inquilinoNombre || 'Inquilino sin nombre'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(contrato.estado)}`}>
                    {CONTRATO_ESTADOS.find(e => e.value === contrato.estado)?.label || contrato.estado}
                  </span>
                  {contrato.estado === 'vigente' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoPagoBadge(contrato.estadoPago)}`}>
                      {contrato.estadoPago?.toUpperCase() || 'PENDIENTE'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(contrato.fechaInicio), 'dd/MM/yyyy', { locale: es })} - 
                    {format(new Date(contrato.fechaFin), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-green-600">
                    ${contrato.montoRenta?.toLocaleString() || 0}
                  </span>
                </div>
                {contrato.diasRestantes > 0 && contrato.estado === 'vigente' && (
                  <div className="col-span-2 text-xs text-gray-500">
                    ⏰ {contrato.diasRestantes} días restantes
                  </div>
                )}
                {contrato.totalPagado > 0 && (
                  <div className="col-span-2 text-xs text-gray-500">
                    Pagado: ${contrato.totalPagado?.toLocaleString() || 0} • 
                    {contrato.mesesPagados || 0} meses
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => onViewDetails(contrato.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver Detalles
                </button>
                
                {isAdmin && (
                  <>
                    <button
                      onClick={() => onEdit(contrato)}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Editar
                    </button>
                    
                    {contrato.estado === 'vigente' && (
                      <>
                        <button
                          onClick={() => handleCambiarEstado(contrato.id, 'rescindido')}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
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
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          Renovar
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {contratos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No se encontraron contratos</p>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { useLocales } from '../../hooks/useLocales';
import { LOCAL_ESTADOS, LOCAL_TIPOS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const LocalesList = ({ onEdit, onViewDetails }) => {
  const { 
    locales, 
    loading, 
    filtros, 
    filtrarLocales,
    cambiarEstado,
    eliminarLocal,
    getEstadisticas
  } = useLocales();
  const { isAdmin, isCobrador } = useAuth();
  const [showFiltros, setShowFiltros] = useState(false);

  const estadisticas = getEstadisticas();

  const handleCambiarEstado = async (id, nuevoEstado) => {
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      await cambiarEstado(id, nuevoEstado);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el local "${nombre}"?`)) {
      await eliminarLocal(id);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoConfig = LOCAL_ESTADOS.find(e => e.value === estado);
    return estadoConfig ? estadoConfig.color : 'bg-gray-100 text-gray-700';
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
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Ocupados</p>
          <p className="text-2xl font-bold text-green-600">{estadisticas.ocupados}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Disponibles</p>
          <p className="text-2xl font-bold text-blue-600">{estadisticas.disponibles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Ocupación</p>
          <p className="text-2xl font-bold text-purple-600">{estadisticas.ocupacion}%</p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={filtros.busqueda}
            onChange={(e) => filtrarLocales({ busqueda: e.target.value })}
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
            onClick={() => onEdit(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Local
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {showFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => filtrarLocales({ estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {LOCAL_ESTADOS.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => filtrarLocales({ tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {LOCAL_TIPOS.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Lista de locales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locales.map(local => (
          <div key={local.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{local.nombre}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(local.estado)}`}>
                  {LOCAL_ESTADOS.find(e => e.value === local.estado)?.label || local.estado}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Dirección:</span> {local.direccion}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Tipo:</span> {LOCAL_TIPOS.find(t => t.value === local.tipo)?.label || local.tipo}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Área:</span> {local.metros} m²
              </p>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onViewDetails(local.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver Detalles
                </button>
                
                {(isAdmin || isCobrador) && (
                  <>
                    <button
                      onClick={() => onEdit(local)}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Editar
                    </button>
                    
                    {isAdmin && (
                      <>
                        <div className="relative">
                          <button
                            onClick={() => {
                              const estados = ['disponible', 'ocupado', 'mantenimiento'];
                              const actualIndex = estados.indexOf(local.estado);
                              const siguiente = estados[(actualIndex + 1) % estados.length];
                              handleCambiarEstado(local.id, siguiente);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Cambiar Estado
                          </button>
                        </div>
                        <button
                          onClick={() => handleEliminar(local.id, local.nombre)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
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

      {locales.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron locales</p>
        </div>
      )}
    </div>
  );
};
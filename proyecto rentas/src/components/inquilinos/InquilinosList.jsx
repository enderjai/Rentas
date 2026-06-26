import React, { useState } from 'react';
import { useInquilinos } from '../../hooks/useInquilinos';
import { INQUILINO_TIPOS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserIcon,
  BuildingOfficeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export const InquilinosList = ({ onEdit, onViewDetails }) => {
  const { 
    inquilinos, 
    loading, 
    filtros, 
    filtrarInquilinos,
    eliminarInquilino
  } = useInquilinos();
  const { isAdmin, isCobrador } = useAuth();
  const [showFiltros, setShowFiltros] = useState(false);

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar al inquilino "${nombre}"?`)) {
      await eliminarInquilino(id);
    }
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
            placeholder="Buscar por nombre, RFC o email..."
            value={filtros.busqueda || ''}
            onChange={(e) => filtrarInquilinos({ busqueda: e.target.value })}
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
            Nuevo Inquilino
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {showFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtros.tipo || 'todos'}
              onChange={(e) => filtrarInquilinos({ tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {INQUILINO_TIPOS.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.activo !== undefined ? (filtros.activo ? 'activo' : 'inactivo') : 'todos'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'todos') {
                  filtrarInquilinos({ activo: undefined });
                } else {
                  filtrarInquilinos({ activo: value === 'activo' });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista de inquilinos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inquilinos.map(inquilino => (
          <div key={inquilino.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {inquilino.tipo === 'persona' ? (
                    <UserIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800">{inquilino.nombre}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  inquilino.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {inquilino.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">RFC:</span> {inquilino.rfc}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {inquilino.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Teléfono:</span> {inquilino.telefono}
                </p>
                {inquilino.localActual && (
                  <p className="text-blue-600 flex items-center gap-1">
                    <HomeIcon className="h-4 w-4" />
                    <span>{inquilino.localNombre || 'Local asignado'}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => onViewDetails(inquilino.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver Detalles
                </button>
                
                {(isAdmin || isCobrador) && (
                  <>
                    <button
                      onClick={() => onEdit(inquilino)}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Editar
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleEliminar(inquilino.id, inquilino.nombre)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {inquilinos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No se encontraron inquilinos</p>
        </div>
      )}
    </div>
  );
};
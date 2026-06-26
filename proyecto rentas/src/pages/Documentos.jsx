import React, { useState, useEffect } from 'react';
import { useDocumentos } from '../hooks/useDocumentos';
import { DocumentList } from '../components/documentos/DocumentList';
import { DocumentUploader } from '../components/documentos/DocumentUploader';
import { DocumentGallery } from '../components/documentos/DocumentGallery';
import { useAuth } from '../contexts/AuthContext';
import { ENTIDAD_TIPOS, DOCUMENTO_TIPOS } from '../utils/constants';
import { Tab } from '@headlessui/react';

export default function Documentos() {
  const { user } = useAuth();
  const [view, setView] = useState('list');
  const [entidadSeleccionada, setEntidadSeleccionada] = useState({
    tipo: 'local',
    id: ''
  });
  const { stats, getStats } = useDocumentos();

  useEffect(() => {
    if (entidadSeleccionada.tipo && entidadSeleccionada.id) {
      getStats(entidadSeleccionada.tipo, entidadSeleccionada.id);
    }
  }, [entidadSeleccionada]);

  const tabs = [
    { name: 'Lista de Documentos', value: 'list' },
    { name: 'Galería', value: 'gallery' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión Documental</h1>

      {/* Filtros de entidad */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Entidad
            </label>
            <select
              value={entidadSeleccionada.tipo}
              onChange={(e) => setEntidadSeleccionada({
                ...entidadSeleccionada,
                tipo: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ENTIDAD_TIPOS.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de la Entidad
            </label>
            <input
              type="text"
              value={entidadSeleccionada.id}
              onChange={(e) => setEntidadSeleccionada({
                ...entidadSeleccionada,
                id: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el ID de la entidad"
            />
          </div>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Total Documentos</p>
              <p className="text-lg font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Tamaño Total</p>
              <p className="text-lg font-bold text-gray-800">
                {DocumentosService.formatFileSize(stats.totalSize)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Tipos</p>
              <p className="text-lg font-bold text-gray-800">
                {Object.keys(stats.porTipo).length}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Última Subida</p>
              <p className="text-lg font-bold text-gray-800 text-sm truncate">
                {stats.ultimaSubida ? format(new Date(stats.ultimaSubida), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      {entidadSeleccionada.id && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected 
                      ? 'bg-white text-blue-700 shadow' 
                      : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                    }`
                  }
                  onClick={() => setView(tab.value)}
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <DocumentList
                  entidadTipo={entidadSeleccionada.tipo}
                  entidadId={entidadSeleccionada.id}
                  onUpload={() => setView('upload')}
                  editable={user?.rol === 'admin'}
                  showActions={user?.rol === 'admin'}
                />
              </Tab.Panel>
              <Tab.Panel>
                <DocumentGallery
                  entidadTipo={entidadSeleccionada.tipo}
                  entidadId={entidadSeleccionada.id}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      )}

      {!entidadSeleccionada.id && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Selecciona una entidad y un ID para ver sus documentos</p>
        </div>
      )}
    </div>
  );
}
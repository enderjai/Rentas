import React, { useState } from 'react';
import { useDocumentos } from '../../hooks/useDocumentos';
import { DOCUMENTO_TIPOS, VISIBILIDAD_OPCIONES } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentosService } from '../../services/documentosService';
import { 
  DocumentIcon, 
  TrashIcon, 
  PencilIcon,
  EyeIcon,
  DownloadIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const DocumentList = ({ 
  entidadTipo, 
  entidadId, 
  onUpload,
  editable = true,
  showActions = true
}) => {
  const { documentos, loading, eliminarDocumento, actualizarDocumento } = useDocumentos({
    entidadTipo,
    entidadId
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const getTipoInfo = (tipo) => {
    return DOCUMENTO_TIPOS.find(t => t.value === tipo) || DOCUMENTO_TIPOS[DOCUMENTO_TIPOS.length - 1];
  };

  const getVisibilidadLabel = (visibilidad) => {
    return VISIBILIDAD_OPCIONES.find(v => v.value === visibilidad)?.label || visibilidad;
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      await eliminarDocumento(id);
    }
  };

  const handleEdit = (documento) => {
    setEditingId(documento.id);
    setEditData({
      nombre: documento.nombre,
      visibilidad: documento.visibilidad,
      descripcion: documento.descripcion || ''
    });
  };

  const handleSaveEdit = async (id) => {
    await actualizarDocumento(id, editData);
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No hay documentos para esta entidad</p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Subir Documento
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Documentos ({documentos.length})
        </h3>
        {onUpload && (
          <button
            onClick={onUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Subir Documento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentos.map(doc => (
          <div
            key={doc.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTipoInfo(doc.tipo)?.icon || '📎'}</span>
                {editingId === doc.id ? (
                  <input
                    type="text"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    className="text-sm font-medium border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {getTipoInfo(doc.tipo)?.label} • {DocumentosService.formatFileSize(doc.tamaño || 0)}
                    </p>
                  </div>
                )}
              </div>
              {editingId !== doc.id && (
                <div className="flex gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Ver/Descargar"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </a>
                  {showActions && (
                    <>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {editingId === doc.id ? (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Visibilidad</label>
                  <select
                    value={editData.visibilidad}
                    onChange={(e) => setEditData({ ...editData, visibilidad: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {VISIBILIDAD_OPCIONES.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Descripción</label>
                  <textarea
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveEdit(doc.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {doc.descripcion && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{doc.descripcion}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {getVisibilidadLabel(doc.visibilidad)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {doc.fechaSubida && format(new Date(doc.fechaSubida), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
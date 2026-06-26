import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DOCUMENTO_TIPOS, VISIBILIDAD_OPCIONES, MAX_FILE_SIZE } from '../../utils/constants';
import { DocumentosService } from '../../services/documentosService';

export const DocumentUploader = ({ 
  entidadTipo, 
  entidadId, 
  onUpload, 
  onCancel 
}) => {
  const [archivos, setArchivos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [formData, setFormData] = useState({
    tipo: 'otro',
    visibilidad: 'admin',
    descripcion: '',
    nombre: ''
  });
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('Algunos archivos no cumplen con los requisitos');
      return;
    }

    // Filtrar archivos por tamaño
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`El archivo ${file.name} excede el tamaño máximo`);
        return false;
      }
      return true;
    });

    setArchivos(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'text/plain': ['.txt']
    },
    maxSize: MAX_FILE_SIZE
  });

  const handleUpload = async () => {
    if (archivos.length === 0) {
      setError('Selecciona al menos un archivo');
      return;
    }

    setUploading(true);
    setProgreso(0);

    try {
      const results = [];
      const total = archivos.length;
      let completados = 0;

      for (const archivo of archivos) {
        const data = {
          ...formData,
          nombre: formData.nombre || archivo.name,
          archivo
        };

        const result = await DocumentosService.subirDocumento(
          data,
          entidadTipo,
          entidadId,
          'user-uid' // En producción, usar user.uid
        );

        if (result.success) {
          results.push(result.documento);
        }
        
        completados++;
        setProgreso((completados / total) * 100);
      }

      onUpload?.(results);
      setArchivos([]);
      setFormData({
        tipo: 'otro',
        visibilidad: 'admin',
        descripcion: '',
        nombre: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENTO_TIPOS.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.icon} {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visibilidad
          </label>
          <select
            value={formData.visibilidad}
            onChange={(e) => setFormData({ ...formData, visibilidad: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VISIBILIDAD_OPCIONES.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre (opcional)
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dejar en blanco para usar el nombre del archivo"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción del documento..."
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-4xl">📤</div>
          <p className="text-gray-600">
            {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra y suelta archivos aquí, o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-gray-400">
            Formatos: imágenes, PDF, Word, Excel, TXT (Máx. 10MB)
          </p>
        </div>
      </div>

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Archivos seleccionados ({archivos.length})</h4>
          {archivos.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {DocumentosService.formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">Subiendo... {Math.round(progreso)}%</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || archivos.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Subir Documentos'}
        </button>
      </div>
    </div>
  );
};
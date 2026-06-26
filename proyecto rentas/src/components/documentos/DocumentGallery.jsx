import React, { useState } from 'react';
import { useDocumentos } from '../../hooks/useDocumentos';
import Lightbox from 'react-18-image-lightbox';
import 'react-18-image-lightbox/style.css';

export const DocumentGallery = ({ entidadTipo, entidadId }) => {
  const { documentos, loading } = useDocumentos({ entidadTipo, entidadId });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar solo imágenes
  const imagenes = documentos.filter(doc => 
    doc.mimeType?.startsWith('image/') || 
    doc.tipo === 'foto'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (imagenes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No hay imágenes para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Galería de Imágenes ({imagenes.length})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imagenes.map((img, index) => (
          <div
            key={img.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            onClick={() => {
              setPhotoIndex(index);
              setIsOpen(true);
            }}
          >
            <img
              src={img.url}
              alt={img.nombre}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">{img.nombre}</p>
            </div>
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {img.tipo}
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <Lightbox
          mainSrc={imagenes[photoIndex].url}
          nextSrc={imagenes[(photoIndex + 1) % imagenes.length].url}
          prevSrc={imagenes[(photoIndex + imagenes.length - 1) % imagenes.length].url}
          onCloseRequest={() => setIsOpen(false)}
          onMovePrevRequest={() =>
            setPhotoIndex((photoIndex + imagenes.length - 1) % imagenes.length)
          }
          onMoveNextRequest={() =>
            setPhotoIndex((photoIndex + 1) % imagenes.length)
          }
          imageCaption={imagenes[photoIndex].nombre}
        />
      )}
    </div>
  );
};
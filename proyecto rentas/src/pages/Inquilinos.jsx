import React, { useState } from 'react';
import { InquilinosList } from '../components/inquilinos/InquilinosList';
import { InquilinoForm } from '../components/inquilinos/InquilinoForm';
import { InquilinoDetail } from '../components/inquilinos/InquilinoDetail';
import { useInquilinos } from '../hooks/useInquilinos';
import { useAuth } from '../contexts/AuthContext';

export default function Inquilinos() {
  const [view, setView] = useState('list');
  const [selectedInquilino, setSelectedInquilino] = useState(null);
  const [selectedInquilinoId, setSelectedInquilinoId] = useState(null);
  const { crearInquilino, actualizarInquilino } = useInquilinos();
  const { isAdmin } = useAuth();

  const handleEdit = (inquilino) => {
    setSelectedInquilino(inquilino);
    setView('form');
  };

  const handleViewDetails = (inquilinoId) => {
    setSelectedInquilinoId(inquilinoId);
    setView('detail');
  };

  const handleSave = async (data) => {
    if (selectedInquilino) {
      await actualizarInquilino(selectedInquilino.id, data);
    } else {
      await crearInquilino(data, data.crearUsuario);
    }
    setView('list');
    setSelectedInquilino(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedInquilino(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedInquilinoId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Inquilinos</h1>
      
      {view === 'list' && (
        <InquilinosList
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
        />
      )}
      
      {view === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedInquilino ? 'Editar Inquilino' : 'Nuevo Inquilino'}
          </h2>
          <InquilinoForm
            inquilino={selectedInquilino}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}
      
      {view === 'detail' && (
        <InquilinoDetail
          inquilinoId={selectedInquilinoId}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
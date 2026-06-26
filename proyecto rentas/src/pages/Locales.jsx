import React, { useState } from 'react';
import { LocalesList } from '../components/locales/LocalesList';
import { LocalForm } from '../components/locales/LocalForm';
import { LocalDetail } from '../components/locales/LocalDetail';
import { useLocales } from '../hooks/useLocales';
import { useAuth } from '../contexts/AuthContext';

export default function Locales() {
  const [view, setView] = useState('list'); // 'list', 'form', 'detail'
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [selectedLocalId, setSelectedLocalId] = useState(null);
  const { crearLocal, actualizarLocal } = useLocales();
  const { isAdmin } = useAuth();

  const handleEdit = (local) => {
    setSelectedLocal(local);
    setView('form');
  };

  const handleViewDetails = (localId) => {
    setSelectedLocalId(localId);
    setView('detail');
  };

  const handleSave = async (data) => {
    if (selectedLocal) {
      await actualizarLocal(selectedLocal.id, data);
    } else {
      await crearLocal(data);
    }
    setView('list');
    setSelectedLocal(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedLocal(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedLocalId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Locales</h1>
      
      {view === 'list' && (
        <LocalesList
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
        />
      )}
      
      {view === 'form' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedLocal ? 'Editar Local' : 'Nuevo Local'}
          </h2>
          <LocalForm
            local={selectedLocal}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}
      
      {view === 'detail' && (
        <LocalDetail
          localId={selectedLocalId}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
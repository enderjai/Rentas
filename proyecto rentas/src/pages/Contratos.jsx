import React, { useState, useEffect } from 'react';
import { ContratosList } from '../components/contratos/ContratosList';
import { ContratoForm } from '../components/contratos/ContratoForm';
import { ContratoDetail } from '../components/contratos/ContratoDetail';
import { useContratos } from '../hooks/useContratos';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { LOCAL_COLECCION, INQUILINO_COLECCION } from '../utils/constants';

export default function Contratos() {
  const [view, setView] = useState('list');
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [selectedContratoId, setSelectedContratoId] = useState(null);
  const [locales, setLocales] = useState([]);
  const [inquilinos, setInquilinos] = useState([]);
  const { crearContrato, actualizarContrato } = useContratos();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const cargarDatos = async () => {
      const localesData = await FirestoreService.getAll(LOCAL_COLECCION);
      const inquilinosData = await FirestoreService.getAll(INQUILINO_COLECCION);
      setLocales(localesData);
      setInquilinos(inquilinosData);
    };
    cargarDatos();
  }, []);

  const handleEdit = (contrato) => {
    setSelectedContrato(contrato);
    setView('form');
  };

  const handleViewDetails = (contratoId) => {
    setSelectedContratoId(contratoId);
    setView('detail');
  };

  const handleCreate = () => {
    setSelectedContrato(null);
    setView('form');
  };

  const handleSave = async (data) => {
    if (selectedContrato) {
      await actualizarContrato(selectedContrato.id, data);
    } else {
      await crearContrato(data);
    }
    setView('list');
    setSelectedContrato(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedContrato(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedContratoId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Contratos</h1>
      
      {view === 'list' && (
        <ContratosList
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          onCreate={handleCreate}
        />
      )}
      
      {view === 'form' && isAdmin && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedContrato ? 'Editar Contrato' : 'Nuevo Contrato'}
          </h2>
          <ContratoForm
            contrato={selectedContrato}
            locales={locales}
            inquilinos={inquilinos}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}
      
      {view === 'detail' && (
        <ContratoDetail
          contratoId={selectedContratoId}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
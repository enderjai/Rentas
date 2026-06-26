import React, { useState, useEffect } from 'react';
import { PagosList } from '../components/pagos/PagosList';
import { PagoForm } from '../components/pagos/PagoForm';
import { MorososList } from '../components/pagos/MorososList';
import { usePagos } from '../hooks/usePagos';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { CONTRATO_COLECCION } from '../utils/constants';
import { Tab } from '@headlessui/react';

export default function Pagos() {
  const [view, setView] = useState('list');
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [contratos, setContratos] = useState([]);
  const { registrarPago } = usePagos();
  const { isAdmin, isCobrador } = useAuth();

  useEffect(() => {
    const cargarContratos = async () => {
      const contratosData = await FirestoreService.getAll(CONTRATO_COLECCION, [
        { field: 'estado', operator: '==', value: 'vigente' }
      ]);
      setContratos(contratosData);
    };
    cargarContratos();
  }, []);

  const handleRegister = (contratoId = null) => {
    if (contratoId) {
      const contrato = contratos.find(c => c.id === contratoId);
      setContratoSeleccionado(contrato);
    } else {
      setContratoSeleccionado(null);
    }
    setView('form');
  };

  const handleSave = async (data) => {
    await registrarPago(data);
    setView('list');
    setContratoSeleccionado(null);
  };

  const handleCancel = () => {
    setView('list');
    setContratoSeleccionado(null);
  };

  const handleViewDetails = (pagoId) => {
    // Implementar vista detalle de pago
    alert(`Ver detalle del pago: ${pagoId}`);
  };

  const tabs = [
    { name: 'Historial de Pagos', value: 'list' },
    { name: 'Morosos', value: 'morosos' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Pagos</h1>
      
      {view === 'list' && (
        <div className="space-y-6">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
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
                <PagosList
                  onRegister={handleRegister}
                  onViewDetails={handleViewDetails}
                />
              </Tab.Panel>
              <Tab.Panel>
                <MorososList 
                  onRegistrarPago={handleRegister}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      )}
      
      {view === 'form' && (isAdmin || isCobrador) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Registrar Nuevo Pago
          </h2>
          <PagoForm
            contratoSeleccionado={contratoSeleccionado}
            contratos={contratos}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}
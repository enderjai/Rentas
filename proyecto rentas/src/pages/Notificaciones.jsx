import React, { useState } from 'react';
import { NotificacionesList } from '../components/notificaciones/NotificacionesList';
import { PreferenciasNotificaciones } from '../components/notificaciones/PreferenciasNotificaciones';
import { EnviarNotificacionManual } from '../components/notificaciones/EnviarNotificacionManual';
import { useAuth } from '../contexts/AuthContext';
import { Tab } from '@headlessui/react';

export default function Notificaciones() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);

  const tabs = [
    { name: 'Bandeja de Entrada', value: 'inbox' },
    { name: 'Preferencias', value: 'preferencias' }
  ];

  if (isAdmin) {
    tabs.push({ name: 'Enviar Notificación', value: 'enviar' });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Notificaciones</h1>

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
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <NotificacionesList />
            </Tab.Panel>
            <Tab.Panel>
              <PreferenciasNotificaciones />
            </Tab.Panel>
            {isAdmin && (
              <Tab.Panel>
                <EnviarNotificacionManual 
                  onEnviado={() => {
                    // Recargar notificaciones
                  }}
                />
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
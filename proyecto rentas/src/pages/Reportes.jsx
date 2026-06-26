import React, { useState, useEffect } from 'react';
import { ReportesService } from '../services/reportesService';
import { DashboardStats } from '../components/reportes/DashboardStats';
import { ReporteIngresos } from '../components/reportes/ReporteIngresos';
import { ReporteMorosidad } from '../components/reportes/ReporteMorosidad';
import { ReporteRenovaciones } from '../components/reportes/ReporteRenovaciones';
import { ReporteOcupacion } from '../components/reportes/ReporteOcupacion';
import { TopInquilinosChart, PagosMetodosChart } from '../components/reportes/Charts';
import { usePagos } from '../hooks/usePagos';
import { Tab } from '@headlessui/react';

export default function Reportes() {
  const [stats, setStats] = useState(null);
  const [topInquilinos, setTopInquilinos] = useState([]);
  const [pagosMetodos, setPagosMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enviarRecordatorio } = usePagos();

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const [statsData, topData, metodosData] = await Promise.all([
        ReportesService.getDashboardStats(),
        ReportesService.getTopInquilinos(),
        ReportesService.getPagosPorMetodo()
      ]);
      setStats(statsData);
      setTopInquilinos(topData);
      setPagosMetodos(metodosData);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reportes y Estadísticas</h1>

      {/* Dashboard Stats */}
      <div className="mb-8">
        <DashboardStats stats={stats} />
      </div>

      {/* Gráficos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <TopInquilinosChart data={topInquilinos} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <PagosMetodosChart data={pagosMetodos} />
        </div>
      </div>

      {/* Reportes detallados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              Ingresos
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              Morosidad
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              Renovaciones
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                }`
              }
            >
              Ocupación
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <ReporteIngresos />
            </Tab.Panel>
            <Tab.Panel>
              <ReporteMorosidad onEnviarRecordatorio={enviarRecordatorio} />
            </Tab.Panel>
            <Tab.Panel>
              <ReporteRenovaciones onEnviarRecordatorio={enviarRecordatorio} />
            </Tab.Panel>
            <Tab.Panel>
              <ReporteOcupacion />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
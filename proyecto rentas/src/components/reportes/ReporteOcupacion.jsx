import React, { useState, useEffect } from 'react';
import { ReportesService } from '../../services/reportesService';
import { OcupacionHistoricaChart, OcupacionChart } from './Charts';
import { ExportButton } from './ExportButton';

export const ReporteOcupacion = () => {
  const [historica, setHistorica] = useState([]);
  const [distribucion, setDistribucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasaRotacion, setTasaRotacion] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const [hist, dist, rotacion] = await Promise.all([
        ReportesService.getOcupacionHistorica(12),
        ReportesService.getDistribucionTipo(),
        ReportesService.getTasaRotacion()
      ]);
      setHistorica(hist);
      setDistribucion(dist);
      setTasaRotacion(rotacion);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  const handleExportCSV = () => {
    const headers = ['mes', 'totalLocales', 'ocupados', 'disponibles', 'mantenimiento', 'tasaOcupacion'];
    const exportData = historica.map(d => ({
      mes: d.mes,
      totalLocales: d.totalLocales,
      ocupados: d.ocupados,
      disponibles: d.disponibles,
      mantenimiento: d.mantenimiento,
      tasaOcupacion: d.tasaOcupacion.toFixed(2) + '%'
    }));
    ReportesService.exportToCSV(exportData, headers, 'reporte_ocupacion');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ultimoDato = historica[historica.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Reporte de Ocupación</h3>
        <ExportButton onExport={handleExportCSV} />
      </div>

      {/* Resumen */}
      {ultimoDato && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Ocupación Actual</p>
            <p className="text-2xl font-bold text-blue-600">
              {ultimoDato.tasaOcupacion.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Locales Ocupados</p>
            <p className="text-2xl font-bold text-green-600">
              {ultimoDato.ocupados}/{ultimoDato.totalLocales}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Disponibles</p>
            <p className="text-2xl font-bold text-yellow-600">
              {ultimoDato.disponibles}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Tasa de Rotación</p>
            <p className="text-2xl font-bold text-purple-600">
              {tasaRotacion.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <OcupacionHistoricaChart data={historica} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <OcupacionChart data={distribucion} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <h4 className="font-medium text-gray-700 mb-4">Histórico Mensual</h4>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mes</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Ocupados</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Disponibles</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Mantenimiento</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Tasa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {historica.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.mes}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">{item.totalLocales}</td>
                <td className="px-4 py-3 text-sm text-center text-green-600">{item.ocupados}</td>
                <td className="px-4 py-3 text-sm text-center text-yellow-600">{item.disponibles}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">{item.mantenimiento}</td>
                <td className="px-4 py-3 text-sm text-center font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.tasaOcupacion >= 80 ? 'bg-green-100 text-green-700' :
                    item.tasaOcupacion >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.tasaOcupacion.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
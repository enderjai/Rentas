import React, { useState, useEffect } from 'react';
import { ReportesService } from '../../services/reportesService';
import { ExportButton } from './ExportButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BellIcon } from '@heroicons/react/24/outline';

export const ReporteRenovaciones = ({ onEnviarRecordatorio }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const renovaciones = await ReportesService.getRenovacionesProximas(dias);
      setData(renovaciones);
      setLoading(false);
    };
    cargarDatos();
  }, [dias]);

  const handleExportCSV = () => {
    const headers = ['inquilinoNombre', 'localNombre', 'fechaFin', 'diasRestantes', 'montoRenta'];
    const exportData = data.map(d => ({
      inquilinoNombre: d.inquilinoNombre,
      localNombre: d.localNombre,
      fechaFin: format(d.fechaFin, 'dd/MM/yyyy'),
      diasRestantes: d.diasRestantes,
      montoRenta: d.montoRenta
    }));
    ReportesService.exportToCSV(exportData, headers, 'reporte_renovaciones');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Contratos a Renovar</h3>
        <div className="flex items-center gap-4">
          <select
            value={dias}
            onChange={(e) => setDias(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value={15}>Próximos 15 días</option>
            <option value={30}>Próximos 30 días</option>
            <option value={60}>Próximos 60 días</option>
            <option value={90}>Próximos 90 días</option>
          </select>
          <ExportButton onExport={handleExportCSV} />
        </div>
      </div>

      {data.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Inquilino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Local</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha Fin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Días Restantes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Renta</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.inquilinoNombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.localNombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(item.fechaFin, 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.diasRestantes <= 7 ? 'bg-red-100 text-red-700' :
                      item.diasRestantes <= 15 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.diasRestantes} días
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                    ${item.montoRenta.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onEnviarRecordatorio(item.contratoId, 'recordatorio')}
                      className="text-blue-600 hover:text-blue-800"
                      title="Enviar recordatorio de renovación"
                    >
                      <BellIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay contratos próximos a renovar</p>
        </div>
      )}
    </div>
  );
};
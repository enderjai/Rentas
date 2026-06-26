import React, { useState, useEffect } from 'react';
import { ReportesService } from '../../services/reportesService';
import { MorosidadChart } from './Charts';
import { ExportButton } from './ExportButton';
import { BellIcon } from '@heroicons/react/24/outline';

export const ReporteMorosidad = ({ onEnviarRecordatorio }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    diasAtrasoMin: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const morosidad = await ReportesService.getMorosidadDetalle(filters);
      setData(morosidad);
      setLoading(false);
    };
    cargarDatos();
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['inquilinoNombre', 'localNombre', 'montoRenta', 'diasAtraso', 'mesesAdeudados', 'deudaTotal'];
    const exportData = data.map(d => ({
      inquilinoNombre: d.inquilinoNombre,
      localNombre: d.localNombre,
      montoRenta: d.montoRenta,
      diasAtraso: d.diasAtraso,
      mesesAdeudados: d.mesesAdeudados,
      deudaTotal: d.deudaTotal
    }));
    ReportesService.exportToCSV(exportData, headers, 'reporte_morosidad');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'critico': return 'bg-red-100 text-red-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
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
        <h3 className="text-lg font-semibold text-gray-800">Reporte de Morosidad</h3>
        <div className="flex items-center gap-4">
          <select
            value={filters.diasAtrasoMin}
            onChange={(e) => setFilters({ ...filters, diasAtrasoMin: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value={0}>Todos</option>
            <option value={5}>Mayor a 5 días</option>
            <option value={15}>Mayor a 15 días</option>
            <option value={30}>Mayor a 30 días</option>
            <option value={60}>Mayor a 60 días</option>
          </select>
          <ExportButton onExport={handleExportCSV} />
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MorosidadChart data={data} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Inquilino</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Local</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Renta</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Días Atraso</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Meses</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Deuda</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Estado</th>
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
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      ${item.montoRenta.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                      {item.diasAtraso}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {item.mesesAdeudados}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                      ${item.deudaTotal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(item.estado)}`}>
                        {item.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEnviarRecordatorio(item.contratoId, 'atraso')}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Enviar recordatorio"
                      >
                        <BellIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay morosos registrados</p>
        </div>
      )}
    </div>
  );
};
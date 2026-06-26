import React, { useState, useEffect } from 'react';
import { ReportesService } from '../../services/reportesService';
import { IngresosChart } from './Charts';
import { ExportButton } from './ExportButton';

export const ReporteIngresos = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    meses: 12
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const ingresos = await ReportesService.getIngresosMensuales(filters.meses);
      setData(ingresos);
      setLoading(false);
    };
    cargarDatos();
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['mes', 'montoEsperado', 'montoPagado', 'diferencia', 'porcentajeCobranza'];
    const exportData = data.map(d => ({
      mes: `${d.mes} ${d.año}`,
      montoEsperado: d.montoEsperado,
      montoPagado: d.montoPagado,
      diferencia: d.diferencia,
      porcentajeCobranza: d.porcentajeCobranza.toFixed(2) + '%'
    }));
    ReportesService.exportToCSV(exportData, headers, 'reporte_ingresos');
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
        <h3 className="text-lg font-semibold text-gray-800">Reporte de Ingresos</h3>
        <div className="flex items-center gap-4">
          <select
            value={filters.meses}
            onChange={(e) => setFilters({ ...filters, meses: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
            <option value={24}>Últimos 24 meses</option>
          </select>
          <ExportButton onExport={handleExportCSV} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <IngresosChart data={data} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mes</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Esperado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Pagado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Diferencia</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">% Cobranza</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.mes} {item.año}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  ${item.montoEsperado.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  ${item.montoPagado.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  item.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${item.diferencia.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.porcentajeCobranza >= 90 ? 'bg-green-100 text-green-700' :
                    item.porcentajeCobranza >= 70 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.porcentajeCobranza.toFixed(1)}%
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
import React, { useState, useEffect } from 'react';
import { usePagos } from '../../hooks/usePagos';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ExclamationTriangleIcon,
  BellIcon,
  CurrencyDollarIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export const MorososList = ({ onRegistrarPago }) => {
  const { getMorosos, enviarRecordatorio } = usePagos();
  const { isAdmin, isCobrador } = useAuth();
  const [morosos, setMorosos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMorosos = async () => {
      setLoading(true);
      const data = await getMorosos();
      setMorosos(data);
      setLoading(false);
    };
    cargarMorosos();
  }, []);

  const handleEnviarRecordatorio = async (contratoId, tipo) => {
    await enviarRecordatorio(contratoId, tipo);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (morosos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <ExclamationTriangleIcon className="h-12 w-12 text-green-300 mx-auto mb-2" />
        <p className="text-gray-500">¡Excelente! No hay morosos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <h3 className="text-red-800 font-medium">
            {morosos.length} {morosos.length === 1 ? 'inquilino' : 'inquilinos'} con pagos atrasados
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {morosos.map((moroso, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-800">{moroso.inquilinoNombre}</h4>
                  <span className="text-sm text-gray-500">•</span>
                  <div className="flex items-center gap-1">
                    <HomeIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{moroso.localNombre}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Días de atraso:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {moroso.diasAtraso} días
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Meses adeudados:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {moroso.mesesAdeudados}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Monto adeudado:</span>
                    <span className="ml-2 font-bold text-red-600">
                      ${moroso.montoAdeudado.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(isAdmin || isCobrador) && (
                  <>
                    <button
                      onClick={() => handleEnviarRecordatorio(moroso.contratoId, 'recordatorio')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm flex items-center gap-1"
                    >
                      <BellIcon className="h-4 w-4" />
                      Recordatorio
                    </button>
                    <button
                      onClick={() => handleEnviarRecordatorio(moroso.contratoId, 'atraso')}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-1"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Aviso Atraso
                    </button>
                    <button
                      onClick={() => onRegistrarPago(moroso.contratoId)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm flex items-center gap-1"
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Registrar Pago
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
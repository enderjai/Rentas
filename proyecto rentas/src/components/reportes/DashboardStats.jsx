import React from 'react';
import { 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export const DashboardStats = ({ stats }) => {
  const cards = [
    {
      title: 'Total Locales',
      value: stats.totalLocales,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      subtitle: `${stats.ocupacionPorcentaje.toFixed(1)}% ocupados`
    },
    {
      title: 'Ingresos del Mes',
      value: `$${stats.ingresosMes.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      subtitle: `Promedio: $${stats.promedioRenta.toLocaleString()}`
    },
    {
      title: 'Morosidad',
      value: `${stats.morosidad.toFixed(1)}%`,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      subtitle: `${stats.contratosVigentes} contratos vigentes`
    },
    {
      title: 'Inquilinos',
      value: stats.totalInquilinos,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      subtitle: `${stats.contratosVigentes} con contrato activo`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
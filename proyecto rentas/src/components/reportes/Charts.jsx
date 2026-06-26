import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie, Scatter } from 'react-chartjs-2';
import { COLORS, CHART_COLORS } from '../../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export const ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  }
};

export const IngresosChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.mes),
    datasets: [
      {
        label: 'Monto Esperado',
        data: data.map(d => d.montoEsperado),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3b82f6',
        borderWidth: 2
      },
      {
        label: 'Monto Pagado',
        data: data.map(d => d.montoPagado),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10b981',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Ingresos Mensuales (Últimos 12 meses)',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }} />
    </div>
  );
};

export const OcupacionChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.tipo),
    datasets: [
      {
        label: 'Cantidad de Locales',
        data: data.map(d => d.cantidad),
        backgroundColor: CHART_COLORS,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Doughnut data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Distribución de Locales por Tipo',
            font: { size: 16 }
          }
        }
      }} />
    </div>
  );
};

export const MorosidadChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.inquilinoNombre),
    datasets: [
      {
        label: 'Días de Atraso',
        data: data.map(d => d.diasAtraso),
        backgroundColor: data.map(d => 
          d.estado === 'critico' ? '#ef4444' :
          d.estado === 'medio' ? '#f59e0b' : '#10b981'
        ),
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Días de Atraso por Inquilino',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Días de Atraso'
            }
          }
        }
      }} />
    </div>
  );
};

export const PagosMetodosChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.metodo),
    datasets: [
      {
        label: 'Total por Método de Pago',
        data: data.map(d => d.total),
        backgroundColor: CHART_COLORS,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Pie data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Distribución de Pagos por Método',
            font: { size: 16 }
          }
        }
      }} />
    </div>
  );
};

export const OcupacionHistoricaChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.mes),
    datasets: [
      {
        label: 'Tasa de Ocupación (%)',
        data: data.map(d => d.tasaOcupacion),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Locales Ocupados',
        data: data.map(d => d.ocupados),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Line data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Histórico de Ocupación',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad / Porcentaje'
            }
          }
        }
      }} />
    </div>
  );
};

export const TopInquilinosChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.nombre),
    datasets: [
      {
        label: 'Total Pagado',
        data: data.map(d => d.totalPagado),
        backgroundColor: CHART_COLORS,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={{
        ...ChartOptions,
        plugins: {
          ...ChartOptions.plugins,
          title: {
            display: true,
            text: 'Top 5 Inquilinos por Monto Pagado',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }} />
    </div>
  );
};
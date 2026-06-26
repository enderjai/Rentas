import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  Timestamp,
  limit,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestoreService';
import { PagosService } from './pagosService';
import { ContratosService } from './contratosService';
import { 
  CONTRATO_COLECCION, 
  LOCAL_COLECCION, 
  INQUILINO_COLECCION,
  PAGO_COLECCION 
} from '../utils/constants';
import { 
  DashboardStats, 
  IngresoMensual, 
  MorosidadDetalle, 
  RenovacionProxima,
  OcupacionHistorica,
  ReporteFilters 
} from '../types/reportes';
import { format, subMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export class ReportesService {
  // Obtener estadísticas del dashboard
  static async getDashboardStats(): Promise<DashboardStats> {
    // Obtener todos los locales
    const locales = await FirestoreService.getAll<any>(LOCAL_COLECCION);
    const totalLocales = locales.length;
    const ocupados = locales.filter(l => l.estado === 'ocupado').length;
    const ocupacionPorcentaje = totalLocales > 0 ? (ocupados / totalLocales) * 100 : 0;

    // Obtener contratos vigentes
    const contratosVigentes = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    // Obtener ingresos del mes actual
    const hoy = new Date();
    const mesActual = format(hoy, 'yyyy-MM');
    const pagosMes = await PagosService.getPagos({ mes: mesActual });
    const ingresosMes = pagosMes.reduce((sum, p) => sum + p.monto, 0);

    // Calcular morosidad
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);
    let totalMorosos = 0;
    let totalAdeudo = 0;

    for (const contrato of contratos) {
      const deuda = await PagosService.getDeudaTotal(contrato.id);
      if (deuda.mesesAdeudados > 0) {
        totalMorosos++;
        totalAdeudo += deuda.totalAdeudado;
      }
    }

    const morosidad = contratos.length > 0 ? (totalMorosos / contratos.length) * 100 : 0;

    // Obtener ingresos anuales
    const año = hoy.getFullYear();
    const pagosAnuales = await PagosService.getPagos({
      fechaInicio: new Date(año, 0, 1),
      fechaFin: new Date(año, 11, 31)
    });
    const ingresosAnuales = pagosAnuales.reduce((sum, p) => sum + p.monto, 0);

    // Promedio de renta
    const totalRenta = contratos.reduce((sum, c) => sum + (c.montoRenta || 0), 0);
    const promedioRenta = contratos.length > 0 ? totalRenta / contratos.length : 0;

    // Total de inquilinos
    const inquilinos = await FirestoreService.getAll<any>(INQUILINO_COLECCION);

    return {
      totalLocales,
      ocupacionPorcentaje,
      ingresosMes,
      morosidad,
      totalInquilinos: inquilinos.length,
      contratosVigentes: contratos.length,
      ingresosAnuales,
      promedioRenta
    };
  }

  // Obtener ingresos mensuales (últimos 12 meses)
  static async getIngresosMensuales(meses: number = 12): Promise<IngresoMensual[]> {
    const hoy = new Date();
    const resultados: IngresoMensual[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = subMonths(hoy, i);
      const mes = format(fecha, 'yyyy-MM');
      const mesNombre = format(fecha, 'MMMM', { locale: es });
      const año = fecha.getFullYear();

      // Monto esperado (suma de rentas de contratos vigentes en ese mes)
      const contratosVigentes = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
        where('estado', '==', 'vigente'),
        where('fechaInicio', '<=', new Date(año, fecha.getMonth(), 1)),
        where('fechaFin', '>=', new Date(año, fecha.getMonth(), 1))
      ]);

      const montoEsperado = contratosVigentes.reduce((sum, c) => sum + (c.montoRenta || 0), 0);

      // Monto pagado
      const pagosMes = await PagosService.getPagos({ mes });
      const montoPagado = pagosMes.reduce((sum, p) => sum + p.monto, 0);

      const diferencia = montoPagado - montoEsperado;
      const porcentajeCobranza = montoEsperado > 0 ? (montoPagado / montoEsperado) * 100 : 0;

      resultados.push({
        mes: mesNombre,
        año,
        montoEsperado,
        montoPagado,
        diferencia,
        porcentajeCobranza
      });
    }

    return resultados;
  }

  // Obtener morosidad detallada
  static async getMorosidadDetalle(filtros?: ReporteFilters): Promise<MorosidadDetalle[]> {
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente')
    ]);

    const morosos: MorosidadDetalle[] = [];

    for (const contrato of contratos) {
      // Filtrar por local si es necesario
      if (filtros?.localId && contrato.localId !== filtros.localId) continue;

      const deuda = await PagosService.getDeudaTotal(contrato.id);
      
      if (deuda.mesesAdeudados > 0) {
        const estadoMes = await PagosService.getEstadoPago(
          contrato.id,
          format(new Date(), 'yyyy-MM')
        );

        const inquilino = await FirestoreService.getById<any>(
          INQUILINO_COLECCION,
          contrato.inquilinoId
        );

        const local = await FirestoreService.getById<any>(
          LOCAL_COLECCION,
          contrato.localId
        );

        // Filtrar por días de atraso
        if (filtros?.diasAtrasoMin && estadoMes.diasAtraso < filtros.diasAtrasoMin) continue;

        const diasAtraso = estadoMes.diasAtraso;
        let estado: 'critico' | 'medio' | 'leve' = 'leve';
        if (diasAtraso > 30) estado = 'critico';
        else if (diasAtraso > 15) estado = 'medio';

        morosos.push({
          contratoId: contrato.id,
          inquilinoId: contrato.inquilinoId,
          inquilinoNombre: inquilino?.nombre || 'Desconocido',
          localId: contrato.localId,
          localNombre: local?.nombre || 'Desconocido',
          montoRenta: contrato.montoRenta || 0,
          diasAtraso,
          mesesAdeudados: deuda.mesesAdeudados,
          deudaTotal: deuda.totalAdeudado,
          ultimoPago: deuda.pagosRealizados[0]?.fechaPago,
          estado
        });
      }
    }

    // Ordenar por días de atraso (mayor a menor)
    return morosos.sort((a, b) => b.diasAtraso - a.diasAtraso);
  }

  // Obtener renovaciones próximas
  static async getRenovacionesProximas(dias: number = 90): Promise<RenovacionProxima[]> {
    const hoy = new Date();
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + dias);

    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
      where('estado', '==', 'vigente'),
      where('fechaFin', '>=', hoy),
      where('fechaFin', '<=', fechaLimite)
    ]);

    const renovaciones: RenovacionProxima[] = [];

    for (const contrato of contratos) {
      const inquilino = await FirestoreService.getById<any>(
        INQUILINO_COLECCION,
        contrato.inquilinoId
      );

      const local = await FirestoreService.getById<any>(
        LOCAL_COLECCION,
        contrato.localId
      );

      const fechaFin = contrato.fechaFin.toDate();
      const diasRestantes = differenceInDays(fechaFin, hoy);

      renovaciones.push({
        contratoId: contrato.id,
        inquilinoId: contrato.inquilinoId,
        inquilinoNombre: inquilino?.nombre || 'Desconocido',
        localId: contrato.localId,
        localNombre: local?.nombre || 'Desconocido',
        fechaFin,
        diasRestantes,
        montoRenta: contrato.montoRenta || 0,
        email: inquilino?.email || '',
        telefono: inquilino?.telefono || ''
      });
    }

    return renovaciones.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  // Obtener ocupación histórica
  static async getOcupacionHistorica(meses: number = 12): Promise<OcupacionHistorica[]> {
    const hoy = new Date();
    const resultados: OcupacionHistorica[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = subMonths(hoy, i);
      const mes = format(fecha, 'MMMM yyyy', { locale: es });

      // Obtener contratos vigentes en ese mes
      const contratosMes = await FirestoreService.getAll<any>(CONTRATO_COLECCION, [
        where('estado', '==', 'vigente'),
        where('fechaInicio', '<=', new Date(fecha.getFullYear(), fecha.getMonth(), 1)),
        where('fechaFin', '>=', new Date(fecha.getFullYear(), fecha.getMonth(), 1))
      ]);

      // Obtener locales totales
      const locales = await FirestoreService.getAll<any>(LOCAL_COLECCION);
      const totalLocales = locales.length;

      // Contar ocupados
      const localesOcupados = await FirestoreService.getAll<any>(LOCAL_COLECCION, [
        where('estado', '==', 'ocupado')
      ]);

      const disponibles = locales.filter(l => l.estado === 'disponible').length;
      const mantenimiento = locales.filter(l => l.estado === 'mantenimiento').length;

      resultados.push({
        mes,
        totalLocales,
        ocupados: localesOcupados.length,
        disponibles,
        mantenimiento,
        tasaOcupacion: totalLocales > 0 ? (localesOcupados.length / totalLocales) * 100 : 0
      });
    }

    return resultados;
  }

  // Obtener top 5 inquilinos por monto pagado
  static async getTopInquilinos(): Promise<any[]> {
    const inquilinos = await FirestoreService.getAll<any>(INQUILINO_COLECCION);
    const pagos = await FirestoreService.getAll<any>(PAGO_COLECCION);

    const resultados = inquilinos.map(inquilino => {
      const pagosInquilino = pagos.filter(p => p.inquilinoId === inquilino.id);
      const totalPagado = pagosInquilino.reduce((sum, p) => sum + p.monto, 0);
      const ultimoPago = pagosInquilino.length > 0 ? 
        pagosInquilino.reduce((max, p) => p.fechaPago > max.fechaPago ? p : p).fechaPago : 
        null;

      return {
        id: inquilino.id,
        nombre: inquilino.nombre,
        totalPagado,
        cantidadPagos: pagosInquilino.length,
        ultimoPago
      };
    });

    return resultados
      .sort((a, b) => b.totalPagado - a.totalPagado)
      .slice(0, 5);
  }

  // Obtener distribución de locales por tipo
  static async getDistribucionTipo(): Promise<any[]> {
    const locales = await FirestoreService.getAll<any>(LOCAL_COLECCION);
    const distribucion: Record<string, number> = {};

    locales.forEach(local => {
      const tipo = local.tipo || 'No especificado';
      distribucion[tipo] = (distribucion[tipo] || 0) + 1;
    });

    return Object.entries(distribucion).map(([tipo, cantidad]) => ({
      tipo,
      cantidad
    }));
  }

  // Exportar reporte a CSV
  static exportToCSV(data: any[], headers: string[], filename: string): void {
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Obtener estadísticas de pagos por método
  static async getPagosPorMetodo(filtros?: ReporteFilters): Promise<any[]> {
    const pagos = await PagosService.getPagos({
      fechaInicio: filtros?.fechaInicio,
      fechaFin: filtros?.fechaFin
    });

    const distribucion: Record<string, { cantidad: number; total: number }> = {};

    pagos.forEach(pago => {
      const metodo = pago.metodo || 'otro';
      if (!distribucion[metodo]) {
        distribucion[metodo] = { cantidad: 0, total: 0 };
      }
      distribucion[metodo].cantidad++;
      distribucion[metodo].total += pago.monto;
    });

    return Object.entries(distribucion).map(([metodo, data]) => ({
      metodo,
      cantidad: data.cantidad,
      total: data.total
    }));
  }

  // Calcular tasa de rotación
  static async getTasaRotacion(): Promise<number> {
    const contratos = await FirestoreService.getAll<any>(CONTRATO_COLECCION);
    const contratosFinalizados = contratos.filter(c => 
      c.estado === 'vencido' || c.estado === 'rescindido'
    );
    
    const hoy = new Date();
    const año = hoy.getFullYear();
    const contratosAño = contratos.filter(c => {
      const fechaInicio = c.fechaInicio.toDate();
      return fechaInicio.getFullYear() === año;
    });

    return contratosAño.length > 0 ? 
      (contratosFinalizados.length / contratosAño.length) * 100 : 0;
  }

  // Generar resumen ejecutivo
  static async getResumenEjecutivo(): Promise<any> {
    const stats = await this.getDashboardStats();
    const ingresosMensuales = await this.getIngresosMensuales(12);
    const morosidadDetalle = await this.getMorosidadDetalle();
    const renovaciones = await this.getRenovacionesProximas(30);

    return {
      stats,
      ingresosMensuales,
      totalMorosos: morosidadDetalle.length,
      renovacionesProximas: renovaciones.length,
      tendenciaIngresos: this.calcularTendencia(ingresosMensuales.map(i => i.montoPagado)),
      promedioCobranza: ingresosMensuales.reduce((sum, i) => sum + i.porcentajeCobranza, 0) / 
        ingresosMensuales.length
    };
  }

  // Helper: Calcular tendencia
  private static calcularTendencia(datos: number[]): 'creciente' | 'decreciente' | 'estable' {
    if (datos.length < 2) return 'estable';
    
    let tendencia = 0;
    for (let i = 1; i < datos.length; i++) {
      if (datos[i] > datos[i-1]) tendencia++;
      else if (datos[i] < datos[i-1]) tendencia--;
    }

    if (tendencia > 2) return 'creciente';
    if (tendencia < -2) return 'decreciente';
    return 'estable';
  }
}
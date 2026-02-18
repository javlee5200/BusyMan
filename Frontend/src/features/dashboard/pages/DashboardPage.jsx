import { useEffect, useMemo, useState } from 'react';
import { ESTADO_ORDEN_OPTIONS, getLabelByValue } from '../../../shared/utils/catalogLabels';
import { listRepuestos } from '../../inventario/inventarioService';
import { listOrdenes } from '../../ordenes/ordenesService';
import {
  getConsumoRepuestos,
  getOrdenesPorEstado,
  getOrdenesPorTecnico,
} from '../../reportes/reportesService';

function extractApiError(error) {
  const apiData = error?.response?.data;
  if (!apiData) return 'No se pudo cargar el dashboard.';
  if (typeof apiData === 'string') return apiData;
  if (apiData.detail) return apiData.detail;
  return 'Error de conexión con backend.';
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function isOlderThanHours(dateIso, hours) {
  if (!dateIso) return false;
  const thresholdMs = hours * 60 * 60 * 1000;
  return Date.now() - new Date(dateIso).getTime() > thresholdMs;
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordenes, setOrdenes] = useState([]);
  const [estadoData, setEstadoData] = useState([]);
  const [tecnicoData, setTecnicoData] = useState([]);
  const [consumoData, setConsumoData] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const kpis = useMemo(() => {
    const totalOrdenes = ordenes.length;
    const abiertas = ordenes.filter((item) => item.estado !== 'ENTREGADO').length;
    const creadasHoy = ordenes.filter(
      (item) => (item.fecha_creacion || '').slice(0, 10) === today,
    ).length;
    const entregadasHoy = ordenes.filter(
      (item) => (item.fecha_entrega || '').slice(0, 10) === today,
    ).length;

    const tiempoPromedioHoras = ordenes
      .filter((item) => item.fecha_creacion && item.fecha_actualizacion)
      .map(
        (item) =>
          (new Date(item.fecha_actualizacion).getTime() -
            new Date(item.fecha_creacion).getTime()) /
          (1000 * 60 * 60),
      );

    const promedio = tiempoPromedioHoras.length
      ? tiempoPromedioHoras.reduce((acc, value) => acc + value, 0) / tiempoPromedioHoras.length
      : 0;

    const costoEstimado = ordenes.reduce((acc, item) => acc + Number(item.costo_estimado || 0), 0);
    const costoFinal = ordenes.reduce((acc, item) => acc + Number(item.costo_final || 0), 0);

    return {
      totalOrdenes,
      abiertas,
      creadasHoy,
      entregadasHoy,
      promedioHoras: promedio,
      costoEstimado,
      costoFinal,
    };
  }, [ordenes, today]);

  const ordenesEstancadas = useMemo(
    () =>
      ordenes
        .filter((item) => item.estado !== 'ENTREGADO' && isOlderThanHours(item.fecha_actualizacion, 48))
        .slice(0, 5),
    [ordenes],
  );

  const stockCritico = useMemo(
    () => repuestos.filter((item) => Number(item.stock_actual) <= Number(item.stock_minimo)).slice(0, 8),
    [repuestos],
  );

  const topConsumos = useMemo(
    () => [...consumoData].sort((a, b) => Number(b.total_cantidad) - Number(a.total_cantidad)).slice(0, 5),
    [consumoData],
  );

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [ordenesResult, estadoResult, tecnicoResult, consumoResult, repuestosResult] =
          await Promise.all([
            listOrdenes(),
            getOrdenesPorEstado(),
            getOrdenesPorTecnico(),
            getConsumoRepuestos(),
            listRepuestos(),
          ]);

        setOrdenes(ordenesResult);
        setEstadoData(estadoResult);
        setTecnicoData(tecnicoResult);
        setConsumoData(consumoResult);
        setRepuestos(repuestosResult);
      } catch (requestError) {
        setError(extractApiError(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <section>
        <h1>Dashboard</h1>
        <div className="card">
          <p>Cargando resumen operativo...</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Resumen operativo del taller con indicadores clave.</p>

      {error && <p className="error-message">{error}</p>}

      <div className="kpi-grid">
        <article className="card kpi-card">
          <span>Total órdenes</span>
          <strong>{kpis.totalOrdenes}</strong>
        </article>
        <article className="card kpi-card">
          <span>Órdenes abiertas</span>
          <strong>{kpis.abiertas}</strong>
        </article>
        <article className="card kpi-card">
          <span>Creadas hoy</span>
          <strong>{kpis.creadasHoy}</strong>
        </article>
        <article className="card kpi-card">
          <span>Entregadas hoy</span>
          <strong>{kpis.entregadasHoy}</strong>
        </article>
        <article className="card kpi-card">
          <span>Tiempo promedio</span>
          <strong>{`${kpis.promedioHoras.toFixed(1)} h`}</strong>
        </article>
        <article className="card kpi-card">
          <span>Costo final acumulado</span>
          <strong>{formatCurrency(kpis.costoFinal)}</strong>
        </article>
      </div>

      <div className="dashboard-grid-2">
        <div className="card table-wrapper">
          <h2>Órdenes por estado</h2>
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {estadoData.length === 0 ? (
                <tr>
                  <td colSpan="2">Sin datos.</td>
                </tr>
              ) : (
                estadoData.map((item) => (
                  <tr key={item.estado}>
                    <td>{getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado)}</td>
                    <td>{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card table-wrapper">
          <h2>Carga por técnico</h2>
          <table>
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tecnicoData.length === 0 ? (
                <tr>
                  <td colSpan="2">Sin datos.</td>
                </tr>
              ) : (
                tecnicoData.map((item, index) => (
                  <tr key={`${item.tecnico_asignado || 'null'}-${index}`}>
                    <td>{item.tecnico_asignado__username || 'Sin asignar'}</td>
                    <td>{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-grid-2">
        <div className="card table-wrapper">
          <h2>Alertas: órdenes estancadas (+48h)</h2>
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Estado</th>
                <th>Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {ordenesEstancadas.length === 0 ? (
                <tr>
                  <td colSpan="3">Sin alertas de estancamiento.</td>
                </tr>
              ) : (
                ordenesEstancadas.map((item) => (
                  <tr key={item.id}>
                    <td>{`OT-${item.id}`}</td>
                    <td>{getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado)}</td>
                    <td>{new Date(item.fecha_actualizacion).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card table-wrapper">
          <h2>Inventario crítico</h2>
          <table>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stockCritico.length === 0 ? (
                <tr>
                  <td colSpan="3">Sin repuestos críticos.</td>
                </tr>
              ) : (
                stockCritico.map((item) => (
                  <tr key={item.id}>
                    <td>{`${item.codigo} - ${item.nombre}`}</td>
                    <td>{item.stock_actual}</td>
                    <td>{item.stock_minimo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card table-wrapper">
        <h2>Top consumos de repuestos</h2>
        <table>
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Total cantidad</th>
              <th>Total costo</th>
            </tr>
          </thead>
          <tbody>
            {topConsumos.length === 0 ? (
              <tr>
                <td colSpan="3">Sin consumos registrados.</td>
              </tr>
            ) : (
              topConsumos.map((item) => (
                <tr key={item.repuesto}>
                  <td>{`${item.repuesto__codigo} - ${item.repuesto__nombre}`}</td>
                  <td>{item.total_cantidad}</td>
                  <td>{formatCurrency(item.total_costo)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DashboardPage;

import { useEffect, useState } from 'react';
import { ESTADO_ORDEN_OPTIONS, getLabelByValue } from '../../../shared/utils/catalogLabels';
import { exportToCsv } from '../../../shared/utils/csvUtils';
import {
  getConsumoRepuestos,
  getOrdenesPorEstado,
  getOrdenesPorTecnico,
} from '../reportesService';

const initialFilters = {
  fecha_inicio: '',
  fecha_fin: '',
};

function extractApiError(error) {
  const apiData = error?.response?.data;

  if (!apiData) {
    return 'No se pudo consultar el reporte.';
  }

  if (typeof apiData === 'string') {
    return apiData;
  }

  if (apiData.detail) {
    return apiData.detail;
  }

  const firstField = Object.keys(apiData)[0];
  const value = apiData[firstField];
  if (Array.isArray(value) && value[0]) {
    return `${firstField}: ${value[0]}`;
  }

  return 'Error de validación en la consulta.';
}

function ReportesPage() {
  const [activeSection, setActiveSection] = useState('estado');
  const [filters, setFilters] = useState(initialFilters);
  const [estadoData, setEstadoData] = useState([]);
  const [tecnicoData, setTecnicoData] = useState([]);
  const [consumoData, setConsumoData] = useState([]);
  const [estadoPrevData, setEstadoPrevData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resumen = {
    totalOrdenes: estadoData.reduce((acc, item) => acc + Number(item.total || 0), 0),
    totalTecnicosActivos: tecnicoData.filter((item) => item.tecnico_asignado).length,
    totalConsumoCantidad: consumoData.reduce((acc, item) => acc + Number(item.total_cantidad || 0), 0),
    totalConsumoCosto: consumoData.reduce((acc, item) => acc + Number(item.total_costo || 0), 0),
  };

  const tecnicoTop = tecnicoData.reduce(
    (max, item) => (Number(item.total || 0) > Number(max?.total || 0) ? item : max),
    null,
  );

  const estadoTop = estadoData.reduce(
    (max, item) => (Number(item.total || 0) > Number(max?.total || 0) ? item : max),
    null,
  );

  const repuestoTop = consumoData.reduce(
    (max, item) =>
      Number(item.total_cantidad || 0) > Number(max?.total_cantidad || 0) ? item : max,
    null,
  );

  const previousTotalsByState = estadoPrevData.reduce((acc, item) => {
    acc[item.estado] = Number(item.total || 0);
    return acc;
  }, {});

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '-';
    }

    return `${Number(value).toFixed(1)}%`;
  }

  function formatDelta(value) {
    const amount = Number(value || 0);
    if (amount > 0) {
      return `+${amount}`;
    }

    return `${amount}`;
  }

  function getDeltaClass(value) {
    const amount = Number(value || 0);
    if (amount > 0) {
      return 'delta-positive';
    }

    if (amount < 0) {
      return 'delta-negative';
    }

    return 'delta-neutral';
  }

  function parseDate(value) {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getPreviousPeriod(activeFilters) {
    const startDate = parseDate(activeFilters.fecha_inicio);
    const endDate = parseDate(activeFilters.fecha_fin);

    if (!startDate || !endDate || endDate < startDate) {
      return null;
    }

    const msInDay = 24 * 60 * 60 * 1000;
    const rangeDays = Math.floor((endDate - startDate) / msInDay) + 1;

    const previousEnd = new Date(startDate.getTime() - msInDay);
    const previousStart = new Date(previousEnd.getTime() - (rangeDays - 1) * msInDay);

    return {
      fecha_inicio: toIsoDate(previousStart),
      fecha_fin: toIsoDate(previousEnd),
    };
  }

  async function loadAllReports(activeFilters = filters) {
    setLoading(true);
    setError('');

    try {
      const previousPeriod = getPreviousPeriod(activeFilters);

      const [estadoResult, tecnicoResult, consumoResult, estadoPrevResult] = await Promise.all([
        getOrdenesPorEstado(activeFilters),
        getOrdenesPorTecnico(activeFilters),
        getConsumoRepuestos(activeFilters),
        previousPeriod ? getOrdenesPorEstado(previousPeriod) : Promise.resolve([]),
      ]);

      setEstadoData(estadoResult);
      setTecnicoData(tecnicoResult);
      setConsumoData(consumoResult);
      setEstadoPrevData(estadoPrevResult);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllReports(initialFilters);
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadAllReports(filters);
  }

  async function clearFilters() {
    setFilters(initialFilters);
    await loadAllReports(initialFilters);
  }

  function getDateSuffix() {
    const inicio = filters.fecha_inicio || 'sin-inicio';
    const fin = filters.fecha_fin || 'sin-fin';
    return `${inicio}_${fin}`;
  }

  function exportEstadoCsv() {
    exportToCsv({
      fileName: `reportes_ordenes_por_estado_${getDateSuffix()}`,
      headers: [
        { key: 'estado', label: 'Estado' },
        { key: 'total', label: 'Total' },
        { key: 'porcentaje', label: '% del total' },
        { key: 'variacion_total', label: 'Variación vs ant.' },
        { key: 'variacion_porcentaje', label: 'Variación %' },
      ],
      rows: estadoData.map((item) => ({
        prevTotal: previousTotalsByState[item.estado] || 0,
        estado: getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado),
        total: item.total,
        porcentaje: formatPercent(
          resumen.totalOrdenes > 0 ? (Number(item.total || 0) / resumen.totalOrdenes) * 100 : 0,
        ),
        variacion_total: formatDelta(Number(item.total || 0) - (previousTotalsByState[item.estado] || 0)),
        variacion_porcentaje:
          (previousTotalsByState[item.estado] || 0) > 0
            ? formatPercent(
                ((Number(item.total || 0) - (previousTotalsByState[item.estado] || 0)) /
                  (previousTotalsByState[item.estado] || 0)) *
                  100,
              )
            : Number(item.total || 0) > 0
              ? 'Nuevo'
              : '0.0%',
      })),
    });
  }

  function exportTecnicoCsv() {
    exportToCsv({
      fileName: `reportes_ordenes_por_tecnico_${getDateSuffix()}`,
      headers: [
        { key: 'tecnico', label: 'Técnico' },
        { key: 'tecnico_id', label: 'ID técnico' },
        { key: 'total', label: 'Total órdenes' },
      ],
      rows: tecnicoData.map((item) => ({
        tecnico: item.tecnico_asignado__username || 'Sin asignar',
        tecnico_id: item.tecnico_asignado || '',
        total: item.total,
      })),
    });
  }

  function exportConsumoCsv() {
    exportToCsv({
      fileName: `reportes_consumo_repuestos_${getDateSuffix()}`,
      headers: [
        { key: 'repuesto', label: 'Repuesto' },
        { key: 'codigo', label: 'Código' },
        { key: 'total_cantidad', label: 'Total cantidad' },
        { key: 'total_costo', label: 'Total costo' },
      ],
      rows: consumoData.map((item) => ({
        repuesto: item.repuesto__nombre,
        codigo: item.repuesto__codigo,
        total_cantidad: item.total_cantidad,
        total_costo: item.total_costo,
      })),
    });
  }

  return (
    <section>
      <h1>Reportes</h1>
      <p>Consulta de indicadores operativos desde los endpoints de reportes.</p>

      <form className="card form-grid" onSubmit={applyFilters}>
        <h2>Filtros por fecha</h2>
        <div className="form-row-2">
          <label>
            Fecha inicio
            <input
              name="fecha_inicio"
              type="date"
              value={filters.fecha_inicio}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Fecha fin
            <input
              name="fecha_fin"
              type="date"
              value={filters.fecha_fin}
              onChange={handleFilterChange}
            />
          </label>
        </div>

        <div className="row-actions">
          <button type="submit">Consultar</button>
          <button type="button" onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </form>

      <div className="card tabs-row">
        <button
          type="button"
          className={activeSection === 'estado' ? 'tab-active' : ''}
          onClick={() => setActiveSection('estado')}
        >
          Órdenes por estado
        </button>
        <button
          type="button"
          className={activeSection === 'tecnico' ? 'tab-active' : ''}
          onClick={() => setActiveSection('tecnico')}
        >
          Órdenes por técnico
        </button>
        <button
          type="button"
          className={activeSection === 'consumo' ? 'tab-active' : ''}
          onClick={() => setActiveSection('consumo')}
        >
          Consumo de repuestos
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {!loading && (
        <div className="kpi-grid">
          <article className="card kpi-card">
            <span>Órdenes en período</span>
            <strong>{resumen.totalOrdenes}</strong>
          </article>
          <article className="card kpi-card">
            <span>Técnicos con carga</span>
            <strong>{resumen.totalTecnicosActivos}</strong>
          </article>
          <article className="card kpi-card">
            <span>Consumos (cantidad)</span>
            <strong>{resumen.totalConsumoCantidad}</strong>
          </article>
          <article className="card kpi-card">
            <span>Costo consumos</span>
            <strong>{formatCurrency(resumen.totalConsumoCosto)}</strong>
          </article>
        </div>
      )}

      {!loading && (
        <div className="dashboard-grid-2">
          <div className="card">
            <h2>Highlights</h2>
            <ul className="highlights-list">
              <li>
                Estado dominante:{' '}
                <strong>
                  {estadoTop
                    ? `${getLabelByValue(ESTADO_ORDEN_OPTIONS, estadoTop.estado, estadoTop.estado)} (${estadoTop.total})`
                    : 'Sin datos'}
                </strong>
              </li>
              <li>
                Técnico con mayor carga:{' '}
                <strong>
                  {tecnicoTop
                    ? `${tecnicoTop.tecnico_asignado__username || 'Sin asignar'} (${tecnicoTop.total})`
                    : 'Sin datos'}
                </strong>
              </li>
              <li>
                Repuesto más consumido:{' '}
                <strong>
                  {repuestoTop
                    ? `${repuestoTop.repuesto__codigo} (${repuestoTop.total_cantidad})`
                    : 'Sin datos'}
                </strong>
              </li>
            </ul>
          </div>

          <div className="card">
            <h2>Período analizado</h2>
            <p>
              Inicio: <strong>{filters.fecha_inicio || 'Sin límite'}</strong>
            </p>
            <p>
              Fin: <strong>{filters.fecha_fin || 'Sin límite'}</strong>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <p>Cargando reportes...</p>
        </div>
      ) : (
        <>
          {activeSection === 'estado' && (
            <div className="card table-wrapper">
              {!(filters.fecha_inicio && filters.fecha_fin) && (
                <p className="table-controls-summary" style={{ marginTop: 0 }}>
                  Para ver comparativos vs período anterior, selecciona fecha inicio y fecha fin.
                </p>
              )}
              <div className="row-actions" style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className="export-csv-btn"
                  onClick={exportEstadoCsv}
                  disabled={estadoData.length === 0}
                >
                  Exportar CSV
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>% del total</th>
                    <th>Variación vs ant.</th>
                    <th>Variación %</th>
                  </tr>
                </thead>
                <tbody>
                  {estadoData.length === 0 ? (
                    <tr>
                      <td colSpan="5">Sin datos para el rango seleccionado.</td>
                    </tr>
                  ) : (
                    estadoData.map((item) => {
                      const totalActual = Number(item.total || 0);
                      const totalAnterior = previousTotalsByState[item.estado] || 0;
                      const delta = totalActual - totalAnterior;

                      let deltaPercent = '0.0%';
                      if (totalAnterior > 0) {
                        deltaPercent = formatPercent((delta / totalAnterior) * 100);
                      } else if (totalActual > 0) {
                        deltaPercent = 'Nuevo';
                      }

                      return (
                        <tr key={item.estado}>
                          <td>{getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado)}</td>
                          <td>{totalActual}</td>
                          <td>
                            {formatPercent(
                              resumen.totalOrdenes > 0
                                ? (Number(item.total || 0) / resumen.totalOrdenes) * 100
                                : 0,
                            )}
                          </td>
                          <td className={getDeltaClass(delta)}>{formatDelta(delta)}</td>
                          <td className={getDeltaClass(delta)}>{deltaPercent}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'tecnico' && (
            <div className="card table-wrapper">
              <div className="row-actions" style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className="export-csv-btn"
                  onClick={exportTecnicoCsv}
                  disabled={tecnicoData.length === 0}
                >
                  Exportar CSV
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Técnico</th>
                    <th>ID</th>
                    <th>Total órdenes</th>
                  </tr>
                </thead>
                <tbody>
                  {tecnicoData.length === 0 ? (
                    <tr>
                      <td colSpan="3">Sin datos para el rango seleccionado.</td>
                    </tr>
                  ) : (
                    tecnicoData.map((item, index) => (
                      <tr key={`${item.tecnico_asignado || 'null'}-${index}`}>
                        <td>{item.tecnico_asignado__username || 'Sin asignar'}</td>
                        <td>{item.tecnico_asignado || '-'}</td>
                        <td>{item.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'consumo' && (
            <div className="card table-wrapper">
              <div className="row-actions" style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className="export-csv-btn"
                  onClick={exportConsumoCsv}
                  disabled={consumoData.length === 0}
                >
                  Exportar CSV
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Código</th>
                    <th>Total cantidad</th>
                    <th>Total costo</th>
                  </tr>
                </thead>
                <tbody>
                  {consumoData.length === 0 ? (
                    <tr>
                      <td colSpan="4">Sin datos para el rango seleccionado.</td>
                    </tr>
                  ) : (
                    consumoData.map((item) => (
                      <tr key={item.repuesto}>
                        <td>{item.repuesto__nombre}</td>
                        <td>{item.repuesto__codigo}</td>
                        <td>{item.total_cantidad}</td>
                        <td>{item.total_costo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ReportesPage;

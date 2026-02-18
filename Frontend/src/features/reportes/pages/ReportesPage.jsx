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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAllReports(activeFilters = filters) {
    setLoading(true);
    setError('');

    try {
      const [estadoResult, tecnicoResult, consumoResult] = await Promise.all([
        getOrdenesPorEstado(activeFilters),
        getOrdenesPorTecnico(activeFilters),
        getConsumoRepuestos(activeFilters),
      ]);

      setEstadoData(estadoResult);
      setTecnicoData(tecnicoResult);
      setConsumoData(consumoResult);
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
      ],
      rows: estadoData.map((item) => ({
        estado: getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado),
        total: item.total,
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

      {loading ? (
        <div className="card">
          <p>Cargando reportes...</p>
        </div>
      ) : (
        <>
          {activeSection === 'estado' && (
            <div className="card table-wrapper">
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
                  </tr>
                </thead>
                <tbody>
                  {estadoData.length === 0 ? (
                    <tr>
                      <td colSpan="2">Sin datos para el rango seleccionado.</td>
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

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listOrdenes } from '../../ordenes/ordenesService';
import TableControls from '../../../shared/components/TableControls';
import { useDeferredDelete } from '../../../shared/hooks/useDeferredDelete';
import {
  MOVIMIENTO_TIPO_OPTIONS,
  getLabelByValue,
} from '../../../shared/utils/catalogLabels';
import { exportToCsv } from '../../../shared/utils/csvUtils';
import { searchAndPaginate } from '../../../shared/utils/tableUtils';
import {
  createConsumo,
  createMovimiento,
  createRepuesto,
  deleteConsumo,
  deleteMovimiento,
  deleteRepuesto,
  listConsumos,
  listMovimientos,
  listRepuestos,
  updateConsumo,
  updateMovimiento,
  updateRepuesto,
} from '../inventarioService';

const initialRepuestoForm = {
  nombre: '',
  codigo: '',
  descripcion: '',
  stock_actual: 0,
  stock_minimo: 0,
  costo_unitario: '0.00',
  activo: true,
};

const initialMovimientoForm = {
  repuesto: '',
  tipo: 'ENTRADA',
  cantidad: 1,
  motivo: '',
  orden_referencia: '',
};

const initialConsumoForm = {
  orden: '',
  repuesto: '',
  cantidad: 1,
  precio_unitario: '0.00',
};

function extractApiError(error) {
  const apiData = error?.response?.data;

  if (!apiData) {
    return 'No se pudo completar la operación.';
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

  return 'Error de validación en la solicitud.';
}

function InventarioPage() {
  const { user } = useAuth();
  const { pendingDeleteKeys, requestDeferredDelete } = useDeferredDelete();
  const [activeSection, setActiveSection] = useState('repuestos');
  const [repuestos, setRepuestos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  const [repuestoForm, setRepuestoForm] = useState(initialRepuestoForm);
  const [movimientoForm, setMovimientoForm] = useState(initialMovimientoForm);
  const [consumoForm, setConsumoForm] = useState(initialConsumoForm);

  const [repuestoEditId, setRepuestoEditId] = useState(null);
  const [movimientoEditId, setMovimientoEditId] = useState(null);
  const [consumoEditId, setConsumoEditId] = useState(null);

  const [movimientoFilters, setMovimientoFilters] = useState({ tipo: '', repuesto_id: '' });
  const [consumoFilters, setConsumoFilters] = useState({ orden_id: '', repuesto_id: '' });
  const [repuestosSearch, setRepuestosSearch] = useState('');
  const [repuestosPage, setRepuestosPage] = useState(1);
  const [repuestosPageSize, setRepuestosPageSize] = useState(10);
  const [movimientosSearch, setMovimientosSearch] = useState('');
  const [movimientosPage, setMovimientosPage] = useState(1);
  const [movimientosPageSize, setMovimientosPageSize] = useState(10);
  const [consumosSearch, setConsumosSearch] = useState('');
  const [consumosPage, setConsumosPage] = useState(1);
  const [consumosPageSize, setConsumosPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const role = user?.role || '';
  const canWrite = useMemo(
    () => ['Administrador', 'Recepción', 'Recepcion'].includes(role) || !role,
    [role],
  );
  const canDelete = role === 'Administrador' || !role;

  function exportRepuestosCsv() {
    exportToCsv({
      fileName: 'inventario_repuestos',
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'stock_actual', label: 'Stock actual' },
        { key: 'stock_minimo', label: 'Stock mínimo' },
        { key: 'costo_unitario', label: 'Costo unitario' },
        { key: 'activo', label: 'Activo' },
      ],
      rows: repuestosTableView.filteredItems.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        costo_unitario: item.costo_unitario,
        activo: item.activo ? 'Sí' : 'No',
      })),
    });
  }

  function exportMovimientosCsv() {
    exportToCsv({
      fileName: 'inventario_movimientos',
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'repuesto', label: 'Repuesto' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'motivo', label: 'Motivo' },
        { key: 'orden', label: 'Orden referencia' },
        { key: 'fecha', label: 'Fecha' },
      ],
      rows: movimientosTableView.filteredItems.map((item) => ({
        id: item.id,
        repuesto: item.repuesto_codigo || repuestoNameById(item.repuesto),
        tipo: getLabelByValue(MOVIMIENTO_TIPO_OPTIONS, item.tipo, item.tipo),
        cantidad: item.cantidad,
        motivo: item.motivo || '',
        orden: item.orden_referencia ? ordenLabelById(item.orden_referencia) : '',
        fecha: new Date(item.fecha).toLocaleString(),
      })),
    });
  }

  function exportConsumosCsv() {
    exportToCsv({
      fileName: 'inventario_consumos',
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'orden', label: 'Orden' },
        { key: 'repuesto', label: 'Repuesto' },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'precio_unitario', label: 'Precio unitario' },
        { key: 'fecha', label: 'Fecha' },
      ],
      rows: consumosTableView.filteredItems.map((item) => ({
        id: item.id,
        orden: ordenLabelById(item.orden),
        repuesto: item.repuesto_codigo || repuestoNameById(item.repuesto),
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        fecha: new Date(item.fecha).toLocaleString(),
      })),
    });
  }

  const repuestosTableView = useMemo(
    () =>
      searchAndPaginate({
        items: repuestos,
        query: repuestosSearch,
        page: repuestosPage,
        pageSize: repuestosPageSize,
        matcher: (item, query, normalizeText) => {
          const target = [
            item.id,
            item.codigo,
            item.nombre,
            item.descripcion,
            item.stock_actual,
            item.stock_minimo,
            item.costo_unitario,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return target.includes(query);
        },
      }),
    [repuestos, repuestosPage, repuestosPageSize, repuestosSearch],
  );

  const movimientosTableView = useMemo(
    () =>
      searchAndPaginate({
        items: movimientos,
        query: movimientosSearch,
        page: movimientosPage,
        pageSize: movimientosPageSize,
        matcher: (item, query, normalizeText) => {
          const target = [
            item.id,
            item.repuesto_codigo,
            item.tipo,
            item.cantidad,
            item.motivo,
            item.orden_referencia,
            item.fecha,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return target.includes(query);
        },
      }),
    [movimientos, movimientosPage, movimientosPageSize, movimientosSearch],
  );

  const consumosTableView = useMemo(
    () =>
      searchAndPaginate({
        items: consumos,
        query: consumosSearch,
        page: consumosPage,
        pageSize: consumosPageSize,
        matcher: (item, query, normalizeText) => {
          const target = [
            item.id,
            item.orden,
            item.repuesto_codigo,
            item.cantidad,
            item.precio_unitario,
            item.fecha,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return target.includes(query);
        },
      }),
    [consumos, consumosPage, consumosPageSize, consumosSearch],
  );

  async function loadBaseData() {
    setLoading(true);
    setError('');

    try {
      const [repuestosData, movimientosData, consumosData, ordenesData] = await Promise.all([
        listRepuestos(),
        listMovimientos(),
        listConsumos(),
        listOrdenes(),
      ]);

      setRepuestos(repuestosData);
      setMovimientos(movimientosData);
      setConsumos(consumosData);
      setOrdenes(ordenesData);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  async function refreshRepuestos() {
    const data = await listRepuestos();
    setRepuestos(data);
    setRepuestosPage(1);
  }

  async function refreshMovimientos(filters = movimientoFilters) {
    const params = {};
    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.repuesto_id) params.repuesto_id = filters.repuesto_id;
    const data = await listMovimientos(params);
    setMovimientos(data);
    setMovimientosPage(1);
  }

  async function refreshConsumos(filters = consumoFilters) {
    const params = {};
    if (filters.orden_id) params.orden_id = filters.orden_id;
    if (filters.repuesto_id) params.repuesto_id = filters.repuesto_id;
    const data = await listConsumos(params);
    setConsumos(data);
    setConsumosPage(1);
  }

  function onRepuestoChange(event) {
    const { name, value, type, checked } = event.target;
    setRepuestoForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function onMovimientoChange(event) {
    const { name, value } = event.target;
    setMovimientoForm((prev) => ({ ...prev, [name]: value }));
  }

  function onConsumoChange(event) {
    const { name, value } = event.target;
    setConsumoForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearFeedback() {
    setError('');
    setMessage('');
  }

  function resetRepuestoForm() {
    setRepuestoForm(initialRepuestoForm);
    setRepuestoEditId(null);
  }

  function resetMovimientoForm() {
    setMovimientoForm(initialMovimientoForm);
    setMovimientoEditId(null);
  }

  function resetConsumoForm() {
    setConsumoForm(initialConsumoForm);
    setConsumoEditId(null);
  }

  async function submitRepuesto(event) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const payload = {
      ...repuestoForm,
      stock_actual: Number(repuestoForm.stock_actual),
      stock_minimo: Number(repuestoForm.stock_minimo),
    };

    try {
      if (repuestoEditId) {
        await updateRepuesto(repuestoEditId, payload);
        setMessage('Repuesto actualizado correctamente.');
      } else {
        await createRepuesto(payload);
        setMessage('Repuesto creado correctamente.');
      }

      resetRepuestoForm();
      await refreshRepuestos();
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMovimiento(event) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const payload = {
      ...movimientoForm,
      repuesto: Number(movimientoForm.repuesto),
      cantidad: Number(movimientoForm.cantidad),
      orden_referencia: movimientoForm.orden_referencia ? Number(movimientoForm.orden_referencia) : null,
    };

    try {
      if (movimientoEditId) {
        await updateMovimiento(movimientoEditId, payload);
        setMessage('Movimiento actualizado correctamente.');
      } else {
        await createMovimiento(payload);
        setMessage('Movimiento registrado correctamente.');
      }

      resetMovimientoForm();
      await Promise.all([refreshMovimientos(), refreshRepuestos()]);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitConsumo(event) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const payload = {
      ...consumoForm,
      orden: Number(consumoForm.orden),
      repuesto: Number(consumoForm.repuesto),
      cantidad: Number(consumoForm.cantidad),
    };

    try {
      if (consumoEditId) {
        await updateConsumo(consumoEditId, payload);
        setMessage('Consumo actualizado correctamente.');
      } else {
        await createConsumo(payload);
        setMessage('Consumo registrado correctamente.');
      }

      resetConsumoForm();
      await Promise.all([refreshConsumos(), refreshMovimientos(), refreshRepuestos()]);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function editRepuesto(item) {
    setRepuestoForm({
      nombre: item.nombre || '',
      codigo: item.codigo || '',
      descripcion: item.descripcion || '',
      stock_actual: item.stock_actual ?? 0,
      stock_minimo: item.stock_minimo ?? 0,
      costo_unitario: item.costo_unitario || '0.00',
      activo: Boolean(item.activo),
    });
    setRepuestoEditId(item.id);
    clearFeedback();
  }

  function editMovimiento(item) {
    setMovimientoForm({
      repuesto: String(item.repuesto || ''),
      tipo: item.tipo || 'ENTRADA',
      cantidad: item.cantidad ?? 1,
      motivo: item.motivo || '',
      orden_referencia: item.orden_referencia ? String(item.orden_referencia) : '',
    });
    setMovimientoEditId(item.id);
    clearFeedback();
  }

  function editConsumo(item) {
    setConsumoForm({
      orden: String(item.orden || ''),
      repuesto: String(item.repuesto || ''),
      cantidad: item.cantidad ?? 1,
      precio_unitario: item.precio_unitario || '0.00',
    });
    setConsumoEditId(item.id);
    clearFeedback();
  }

  async function removeEntity({ deleteKey, entityName, itemId, undoLabel, action }) {
    clearFeedback();

    await requestDeferredDelete({
      deleteKey,
      confirmTitle: `Eliminar ${entityName.toLowerCase()}`,
      confirmMessage: `¿Eliminar ${entityName} #${itemId}?`,
      undoLabel,
      successMessage: `${entityName} eliminado correctamente.`,
      onCommit: async () => {
        await action();
        await Promise.all([refreshRepuestos(), refreshMovimientos(), refreshConsumos()]);
      },
    });
  }

  async function applyMovimientoFilters(event) {
    event.preventDefault();
    clearFeedback();

    try {
      await refreshMovimientos(movimientoFilters);
    } catch (requestError) {
      setError(extractApiError(requestError));
    }
  }

  async function applyConsumoFilters(event) {
    event.preventDefault();
    clearFeedback();

    try {
      await refreshConsumos(consumoFilters);
    } catch (requestError) {
      setError(extractApiError(requestError));
    }
  }

  function repuestoNameById(id) {
    return repuestos.find((item) => item.id === id)?.nombre || `Repuesto ${id}`;
  }

  function ordenLabelById(id) {
    const orden = ordenes.find((item) => item.id === id);
    if (!orden) return `OT-${id}`;
    return `OT-${orden.id} (${orden.equipo_marca || ''} ${orden.equipo_modelo || ''})`;
  }

  return (
    <section>
      <h1>Inventario</h1>
      <p>Gestión de repuestos, movimientos y consumos conectada al backend.</p>

      <div className="card tabs-row">
        <button type="button" className={activeSection === 'repuestos' ? 'tab-active' : ''} onClick={() => setActiveSection('repuestos')}>
          Repuestos
        </button>
        <button type="button" className={activeSection === 'movimientos' ? 'tab-active' : ''} onClick={() => setActiveSection('movimientos')}>
          Movimientos
        </button>
        <button type="button" className={activeSection === 'consumos' ? 'tab-active' : ''} onClick={() => setActiveSection('consumos')}>
          Consumos
        </button>
      </div>

      {message && <p>{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="card">
          <p>Cargando inventario...</p>
        </div>
      ) : (
        <>
          {activeSection === 'repuestos' && (
            <>
              {canWrite ? (
                <form className="card form-grid" onSubmit={submitRepuesto}>
                  <h2>{repuestoEditId ? 'Editar repuesto' : 'Nuevo repuesto'}</h2>
                  <div className="form-row-2">
                    <label>
                      Nombre
                      <input name="nombre" value={repuestoForm.nombre} onChange={onRepuestoChange} required />
                    </label>
                    <label>
                      Código
                      <input name="codigo" value={repuestoForm.codigo} onChange={onRepuestoChange} required />
                    </label>
                  </div>

                  <label>
                    Descripción
                    <textarea name="descripcion" rows={2} value={repuestoForm.descripcion} onChange={onRepuestoChange} />
                  </label>

                  <div className="form-row-2">
                    <label>
                      Stock actual
                      <input
                        name="stock_actual"
                        type="number"
                        min="0"
                        value={repuestoForm.stock_actual}
                        onChange={onRepuestoChange}
                        required
                      />
                    </label>
                    <label>
                      Stock mínimo
                      <input
                        name="stock_minimo"
                        type="number"
                        min="0"
                        value={repuestoForm.stock_minimo}
                        onChange={onRepuestoChange}
                        required
                      />
                    </label>
                  </div>

                  <div className="form-row-2">
                    <label>
                      Costo unitario
                      <input
                        name="costo_unitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={repuestoForm.costo_unitario}
                        onChange={onRepuestoChange}
                        required
                      />
                    </label>

                    <label className="checkbox-inline">
                      <input
                        name="activo"
                        type="checkbox"
                        checked={repuestoForm.activo}
                        onChange={onRepuestoChange}
                      />
                      Activo
                    </label>
                  </div>

                  <div className="row-actions">
                    <button type="submit" disabled={submitting}>
                      {submitting ? 'Guardando...' : repuestoEditId ? 'Actualizar' : 'Crear'}
                    </button>
                    {repuestoEditId && (
                      <button type="button" onClick={resetRepuestoForm}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p>No tienes permisos para crear o editar repuestos.</p>
              )}

              <div className="card table-wrapper">
                <TableControls
                  searchValue={repuestosSearch}
                  onSearchChange={(value) => {
                    setRepuestosSearch(value);
                    setRepuestosPage(1);
                  }}
                  searchPlaceholder="Buscar en código, nombre, descripción o stock"
                  totalItems={repuestosTableView.totalItems}
                  currentPage={repuestosTableView.currentPage}
                  totalPages={repuestosTableView.totalPages}
                  pageSize={repuestosPageSize}
                  onPageSizeChange={(size) => {
                    setRepuestosPageSize(size);
                    setRepuestosPage(1);
                  }}
                  onPrevPage={() => setRepuestosPage((previous) => Math.max(1, previous - 1))}
                  onNextPage={() =>
                    setRepuestosPage((previous) => Math.min(repuestosTableView.totalPages, previous + 1))
                  }
                  onExportCsv={exportRepuestosCsv}
                />
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                      <th>Costo</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestosTableView.pagedItems.length === 0 ? (
                      <tr>
                        <td colSpan="8">No hay repuestos registrados.</td>
                      </tr>
                    ) : (
                      repuestosTableView.pagedItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.codigo}</td>
                          <td>{item.nombre}</td>
                          <td>{item.stock_actual}</td>
                          <td>{item.stock_minimo}</td>
                          <td>{item.costo_unitario}</td>
                          <td>{item.activo ? 'Sí' : 'No'}</td>
                          <td>
                            {canWrite && (
                              <button type="button" onClick={() => editRepuesto(item)}>
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeEntity({
                                    deleteKey: `repuesto-${item.id}`,
                                    entityName: 'Repuesto',
                                    itemId: item.id,
                                    undoLabel: `Repuesto ${item.codigo}`,
                                    action: () => deleteRepuesto(item.id),
                                  })
                                }
                                disabled={pendingDeleteKeys.has(`repuesto-${item.id}`)}
                              >
                                {pendingDeleteKeys.has(`repuesto-${item.id}`) ? 'Pendiente...' : 'Eliminar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'movimientos' && (
            <>
              <form className="card form-grid" onSubmit={applyMovimientoFilters}>
                <h2>Filtros de movimientos</h2>
                <div className="form-row-2">
                  <label>
                    Tipo
                    <select
                      name="tipo"
                      value={movimientoFilters.tipo}
                      onChange={(event) =>
                        setMovimientoFilters((prev) => ({ ...prev, tipo: event.target.value }))
                      }
                    >
                      <option value="">Todos</option>
                      {MOVIMIENTO_TIPO_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Repuesto
                    <select
                      name="repuesto_id"
                      value={movimientoFilters.repuesto_id}
                      onChange={(event) =>
                        setMovimientoFilters((prev) => ({ ...prev, repuesto_id: event.target.value }))
                      }
                    >
                      <option value="">Todos</option>
                      {repuestos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigo} - {item.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row-actions">
                  <button type="submit">Aplicar filtros</button>
                  <button
                    type="button"
                    onClick={async () => {
                      const cleaned = { tipo: '', repuesto_id: '' };
                      setMovimientoFilters(cleaned);
                      await refreshMovimientos(cleaned);
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {canWrite ? (
                <form className="card form-grid" onSubmit={submitMovimiento}>
                  <h2>{movimientoEditId ? 'Editar movimiento' : 'Nuevo movimiento manual'}</h2>
                  <div className="form-row-2">
                    <label>
                      Repuesto
                      <select name="repuesto" value={movimientoForm.repuesto} onChange={onMovimientoChange} required>
                        <option value="">Selecciona un repuesto</option>
                        {repuestos.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.codigo} - {item.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tipo
                      <select name="tipo" value={movimientoForm.tipo} onChange={onMovimientoChange}>
                        {MOVIMIENTO_TIPO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-row-2">
                    <label>
                      Cantidad
                      <input
                        name="cantidad"
                        type="number"
                        min="1"
                        value={movimientoForm.cantidad}
                        onChange={onMovimientoChange}
                        required
                      />
                    </label>
                    <label>
                      Orden referencia (opcional)
                      <select
                        name="orden_referencia"
                        value={movimientoForm.orden_referencia}
                        onChange={onMovimientoChange}
                      >
                        <option value="">Sin orden</option>
                        {ordenes.map((item) => (
                          <option key={item.id} value={item.id}>
                            OT-{item.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    Motivo
                    <input name="motivo" value={movimientoForm.motivo} onChange={onMovimientoChange} />
                  </label>

                  <div className="row-actions">
                    <button type="submit" disabled={submitting}>
                      {submitting ? 'Guardando...' : movimientoEditId ? 'Actualizar' : 'Registrar'}
                    </button>
                    {movimientoEditId && (
                      <button type="button" onClick={resetMovimientoForm}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p>No tienes permisos para registrar movimientos.</p>
              )}

              <div className="card table-wrapper">
                <TableControls
                  searchValue={movimientosSearch}
                  onSearchChange={(value) => {
                    setMovimientosSearch(value);
                    setMovimientosPage(1);
                  }}
                  searchPlaceholder="Buscar en repuesto, tipo, motivo u orden"
                  totalItems={movimientosTableView.totalItems}
                  currentPage={movimientosTableView.currentPage}
                  totalPages={movimientosTableView.totalPages}
                  pageSize={movimientosPageSize}
                  onPageSizeChange={(size) => {
                    setMovimientosPageSize(size);
                    setMovimientosPage(1);
                  }}
                  onPrevPage={() => setMovimientosPage((previous) => Math.max(1, previous - 1))}
                  onNextPage={() =>
                    setMovimientosPage((previous) =>
                      Math.min(movimientosTableView.totalPages, previous + 1),
                    )
                  }
                  onExportCsv={exportMovimientosCsv}
                />
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Repuesto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosTableView.pagedItems.length === 0 ? (
                      <tr>
                        <td colSpan="8">No hay movimientos para mostrar.</td>
                      </tr>
                    ) : (
                      movimientosTableView.pagedItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.repuesto_codigo || repuestoNameById(item.repuesto)}</td>
                          <td>{getLabelByValue(MOVIMIENTO_TIPO_OPTIONS, item.tipo, item.tipo)}</td>
                          <td>{item.cantidad}</td>
                          <td>{item.motivo || '-'}</td>
                          <td>{item.orden_referencia ? ordenLabelById(item.orden_referencia) : '-'}</td>
                          <td>{new Date(item.fecha).toLocaleString()}</td>
                          <td>
                            {canWrite && (
                              <button type="button" onClick={() => editMovimiento(item)}>
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeEntity({
                                    deleteKey: `movimiento-${item.id}`,
                                    entityName: 'Movimiento',
                                    itemId: item.id,
                                    undoLabel: `Movimiento #${item.id}`,
                                    action: () => deleteMovimiento(item.id),
                                  })
                                }
                                disabled={pendingDeleteKeys.has(`movimiento-${item.id}`)}
                              >
                                {pendingDeleteKeys.has(`movimiento-${item.id}`)
                                  ? 'Pendiente...'
                                  : 'Eliminar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'consumos' && (
            <>
              <form className="card form-grid" onSubmit={applyConsumoFilters}>
                <h2>Filtros de consumos</h2>
                <div className="form-row-2">
                  <label>
                    Orden
                    <select
                      name="orden_id"
                      value={consumoFilters.orden_id}
                      onChange={(event) =>
                        setConsumoFilters((prev) => ({ ...prev, orden_id: event.target.value }))
                      }
                    >
                      <option value="">Todas</option>
                      {ordenes.map((item) => (
                        <option key={item.id} value={item.id}>
                          OT-{item.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Repuesto
                    <select
                      name="repuesto_id"
                      value={consumoFilters.repuesto_id}
                      onChange={(event) =>
                        setConsumoFilters((prev) => ({ ...prev, repuesto_id: event.target.value }))
                      }
                    >
                      <option value="">Todos</option>
                      {repuestos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigo} - {item.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="row-actions">
                  <button type="submit">Aplicar filtros</button>
                  <button
                    type="button"
                    onClick={async () => {
                      const cleaned = { orden_id: '', repuesto_id: '' };
                      setConsumoFilters(cleaned);
                      await refreshConsumos(cleaned);
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {canWrite ? (
                <form className="card form-grid" onSubmit={submitConsumo}>
                  <h2>{consumoEditId ? 'Editar consumo' : 'Registrar consumo en orden'}</h2>
                  <div className="form-row-2">
                    <label>
                      Orden
                      <select name="orden" value={consumoForm.orden} onChange={onConsumoChange} required>
                        <option value="">Selecciona una orden</option>
                        {ordenes.map((item) => (
                          <option key={item.id} value={item.id}>
                            OT-{item.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Repuesto
                      <select name="repuesto" value={consumoForm.repuesto} onChange={onConsumoChange} required>
                        <option value="">Selecciona un repuesto</option>
                        {repuestos.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.codigo} - {item.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-row-2">
                    <label>
                      Cantidad
                      <input
                        name="cantidad"
                        type="number"
                        min="1"
                        value={consumoForm.cantidad}
                        onChange={onConsumoChange}
                        required
                      />
                    </label>
                    <label>
                      Precio unitario
                      <input
                        name="precio_unitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={consumoForm.precio_unitario}
                        onChange={onConsumoChange}
                        required
                      />
                    </label>
                  </div>

                  <div className="row-actions">
                    <button type="submit" disabled={submitting}>
                      {submitting ? 'Guardando...' : consumoEditId ? 'Actualizar' : 'Registrar'}
                    </button>
                    {consumoEditId && (
                      <button type="button" onClick={resetConsumoForm}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p>No tienes permisos para registrar consumos.</p>
              )}

              <div className="card table-wrapper">
                <TableControls
                  searchValue={consumosSearch}
                  onSearchChange={(value) => {
                    setConsumosSearch(value);
                    setConsumosPage(1);
                  }}
                  searchPlaceholder="Buscar en orden, repuesto, cantidad o precio"
                  totalItems={consumosTableView.totalItems}
                  currentPage={consumosTableView.currentPage}
                  totalPages={consumosTableView.totalPages}
                  pageSize={consumosPageSize}
                  onPageSizeChange={(size) => {
                    setConsumosPageSize(size);
                    setConsumosPage(1);
                  }}
                  onPrevPage={() => setConsumosPage((previous) => Math.max(1, previous - 1))}
                  onNextPage={() =>
                    setConsumosPage((previous) => Math.min(consumosTableView.totalPages, previous + 1))
                  }
                  onExportCsv={exportConsumosCsv}
                />
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Orden</th>
                      <th>Repuesto</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumosTableView.pagedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7">No hay consumos para mostrar.</td>
                      </tr>
                    ) : (
                      consumosTableView.pagedItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{ordenLabelById(item.orden)}</td>
                          <td>{item.repuesto_codigo || repuestoNameById(item.repuesto)}</td>
                          <td>{item.cantidad}</td>
                          <td>{item.precio_unitario}</td>
                          <td>{new Date(item.fecha).toLocaleString()}</td>
                          <td>
                            {canWrite && (
                              <button type="button" onClick={() => editConsumo(item)}>
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeEntity({
                                    deleteKey: `consumo-${item.id}`,
                                    entityName: 'Consumo',
                                    itemId: item.id,
                                    undoLabel: `Consumo #${item.id}`,
                                    action: () => deleteConsumo(item.id),
                                  })
                                }
                                disabled={pendingDeleteKeys.has(`consumo-${item.id}`)}
                              >
                                {pendingDeleteKeys.has(`consumo-${item.id}`) ? 'Pendiente...' : 'Eliminar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default InventarioPage;

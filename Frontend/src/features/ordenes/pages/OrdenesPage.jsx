import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listEquipos } from '../../equipos/equiposService';
import { listTecnicos } from '../../usuarios/usuariosService';
import TableControls from '../../../shared/components/TableControls';
import { useDeferredAction } from '../../../shared/hooks/useDeferredAction';
import { useDeferredDelete } from '../../../shared/hooks/useDeferredDelete';
import { ESTADO_ORDEN_OPTIONS, getLabelByValue } from '../../../shared/utils/catalogLabels';
import { exportToCsv } from '../../../shared/utils/csvUtils';
import { searchAndPaginate } from '../../../shared/utils/tableUtils';
import { createOrden, deleteOrden, listOrdenes, updateOrden } from '../ordenesService';

const initialForm = {
  equipo: '',
  tecnico_asignado: '',
  descripcion_falla: '',
  diagnostico: '',
  solucion: '',
  costo_estimado: '0.00',
  costo_final: '0.00',
  estado: 'INGRESADO',
};

const initialFilters = {
  estado: '',
  tecnico_id: '',
  equipo_id: '',
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

function getEquipoLabel(equipo) {
  return `${equipo.id} - ${equipo.marca} ${equipo.modelo || ''} (${equipo.numero_serie || 'sin serie'})`;
}

function normalizeEquipoText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function OrdenesPage() {
  const { user } = useAuth();
  const { pendingActionKeys, requestDeferredAction } = useDeferredAction();
  const { pendingDeleteKeys, requestDeferredDelete } = useDeferredDelete();
  const [ordenes, setOrdenes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [estadoDraftById, setEstadoDraftById] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [equipoSearch, setEquipoSearch] = useState('');
  const [equipoDropdownOpen, setEquipoDropdownOpen] = useState(false);
  const [filterEquipoSearch, setFilterEquipoSearch] = useState('');
  const [filterEquipoDropdownOpen, setFilterEquipoDropdownOpen] = useState(false);

  const filteredEquiposForForm = useMemo(() => {
    const query = normalizeEquipoText(equipoSearch);
    if (!query) return equipos;

    return equipos.filter((equipo) => {
      const target = normalizeEquipoText(
        `${equipo.id} ${equipo.marca || ''} ${equipo.modelo || ''} ${equipo.numero_serie || ''}`,
      );
      return target.includes(query);
    });
  }, [equipos, equipoSearch]);

  const filteredEquiposForFilters = useMemo(() => {
    const query = normalizeEquipoText(filterEquipoSearch);
    if (!query) return equipos;

    return equipos.filter((equipo) => {
      const target = normalizeEquipoText(
        `${equipo.id} ${equipo.marca || ''} ${equipo.modelo || ''} ${equipo.numero_serie || ''}`,
      );
      return target.includes(query);
    });
  }, [equipos, filterEquipoSearch]);

  const role = user?.role || '';
  const canCreate = useMemo(
    () => ['Administrador', 'Recepción', 'Recepcion'].includes(role) || !role,
    [role],
  );
  const canUpdate = useMemo(
    () => ['Administrador', 'Recepción', 'Recepcion', 'Técnico', 'Tecnico'].includes(role) || !role,
    [role],
  );
  const canDelete = role === 'Administrador' || !role;

  function exportOrdenesCsv() {
    exportToCsv({
      fileName: 'ordenes',
      headers: [
        { key: 'orden', label: 'Orden' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'equipo', label: 'Equipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'tecnico', label: 'Técnico' },
        { key: 'costo_estimado', label: 'Costo estimado' },
        { key: 'costo_final', label: 'Costo final' },
      ],
      rows: tableView.filteredItems.map((item) => ({
        orden: `OT-${item.id}`,
        cliente: `${item.cliente_nombre || ''} ${item.cliente_apellido || ''}`.trim(),
        equipo: `${item.equipo_marca || ''} ${item.equipo_modelo || ''}`.trim(),
        estado: getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado, item.estado),
        tecnico: getTecnicoLabel(item.tecnico_asignado),
        costo_estimado: item.costo_estimado,
        costo_final: item.costo_final,
      })),
    });
  }

  const tableView = useMemo(
    () =>
      searchAndPaginate({
        items: ordenes,
        query: tableSearch,
        page: tablePage,
        pageSize: tablePageSize,
        matcher: (item, query, normalizeText) => {
          const target = [
            item.id,
            item.estado,
            item.cliente_nombre,
            item.cliente_apellido,
            item.equipo_marca,
            item.equipo_modelo,
            item.descripcion_falla,
            item.diagnostico,
            item.solucion,
            item.tecnico_asignado,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return target.includes(query);
        },
      }),
    [ordenes, tablePage, tablePageSize, tableSearch],
  );

  async function loadEquiposOptions() {
    try {
      const data = await listEquipos();
      setEquipos(data);
    } catch {
      setEquipos([]);
    }
  }

  async function loadTecnicosOptions() {
    try {
      const data = await listTecnicos();
      setTecnicos(data);
    } catch {
      setTecnicos([]);
    }
  }

  function getTecnicoLabel(tecnicoId) {
    if (!tecnicoId) return '-';
    const tecnico = tecnicos.find((item) => item.id === tecnicoId);
    return tecnico?.label || `ID ${tecnicoId}`;
  }

  function getDraftEstado(orden) {
    return estadoDraftById[orden.id] || orden.estado;
  }

  function onChangeDraftEstado(ordenId, estado) {
    setEstadoDraftById((previous) => ({
      ...previous,
      [ordenId]: estado,
    }));
  }

  async function handleDeferredEstadoChange(orden) {
    const nextEstado = getDraftEstado(orden);
    if (!nextEstado || nextEstado === orden.estado) {
      return;
    }

    setError('');
    setMessage('');

    await requestDeferredAction({
      actionKey: `orden-estado-${orden.id}`,
      confirmTitle: 'Cambiar estado de orden',
      confirmMessage: `¿Cambiar OT-${orden.id} de ${orden.estado} a ${nextEstado}?`,
      undoLabel: `Cambio de estado OT-${orden.id}`,
      successMessage: `Estado de OT-${orden.id} actualizado a ${nextEstado}.`,
      onCommit: async () => {
        await updateOrden(orden.id, { estado: nextEstado });
        await loadOrdenes();
      },
    });
  }

  async function loadOrdenes(activeFilters = filters) {
    setLoading(true);
    setError('');

    const params = {};
    if (activeFilters.estado) params.estado = activeFilters.estado;
    if (activeFilters.tecnico_id) params.tecnico_id = activeFilters.tecnico_id;
    if (activeFilters.equipo_id) params.equipo_id = activeFilters.equipo_id;

    try {
      const data = await listOrdenes(params);
      setOrdenes(data);
      setTablePage(1);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEquiposOptions();
    loadTecnicosOptions();
    loadOrdenes(initialFilters);
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  function handleFilterEquipoSearchChange(value) {
    setFilterEquipoSearch(value);
    setFilterEquipoDropdownOpen(true);
    setFilters((previous) => ({ ...previous, equipo_id: '' }));
  }

  function selectFilterEquipo(equipo) {
    setFilters((previous) => ({
      ...previous,
      equipo_id: String(equipo.id),
    }));
    setFilterEquipoSearch(getEquipoLabel(equipo));
    setFilterEquipoDropdownOpen(false);
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setEquipoSearch('');
    setEquipoDropdownOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.equipo) {
      setError('Selecciona un equipo válido.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      ...form,
      equipo: Number(form.equipo),
      tecnico_asignado: form.tecnico_asignado ? Number(form.tecnico_asignado) : null,
    };

    try {
      if (editingId) {
        await updateOrden(editingId, payload);
        setMessage('Orden actualizada correctamente.');
      } else {
        await createOrden(payload);
        setMessage('Orden creada correctamente.');
      }

      resetForm();
      await loadOrdenes();
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(orden) {
    const selectedEquipo = equipos.find((item) => item.id === orden.equipo);

    setForm({
      equipo: String(orden.equipo || ''),
      tecnico_asignado: orden.tecnico_asignado ? String(orden.tecnico_asignado) : '',
      descripcion_falla: orden.descripcion_falla || '',
      diagnostico: orden.diagnostico || '',
      solucion: orden.solucion || '',
      costo_estimado: orden.costo_estimado || '0.00',
      costo_final: orden.costo_final || '0.00',
      estado: orden.estado || 'INGRESADO',
    });
    setEquipoSearch(selectedEquipo ? getEquipoLabel(selectedEquipo) : '');
    setEquipoDropdownOpen(false);
    setEditingId(orden.id);
    setError('');
    setMessage('');
  }

  function handleEquipoSearchChange(value) {
    setEquipoSearch(value);
    setEquipoDropdownOpen(true);
    setForm((previous) => ({ ...previous, equipo: '' }));
  }

  function selectEquipo(equipo) {
    setForm((previous) => ({
      ...previous,
      equipo: String(equipo.id),
    }));
    setEquipoSearch(getEquipoLabel(equipo));
    setEquipoDropdownOpen(false);
  }

  async function handleDelete(orden) {
    setError('');
    setMessage('');

    await requestDeferredDelete({
      deleteKey: `orden-${orden.id}`,
      confirmTitle: 'Eliminar orden',
      confirmMessage: `¿Eliminar la orden OT-${orden.id}?`,
      undoLabel: `Orden OT-${orden.id}`,
      successMessage: 'Orden eliminada correctamente.',
      onCommit: async () => {
        await deleteOrden(orden.id);
        await loadOrdenes();
      },
    });
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadOrdenes(filters);
  }

  async function clearFilters() {
    setFilters(initialFilters);
    setFilterEquipoSearch('');
    setFilterEquipoDropdownOpen(false);
    await loadOrdenes(initialFilters);
  }

  return (
    <section>
      <h1>Órdenes</h1>
      <p>Gestión de órdenes conectada a la API `/api/ordenes/` con historial de estado.</p>

      <form className="card form-grid" onSubmit={applyFilters}>
        <h2>Filtros</h2>
        <div className="form-row-2">
          <label>
            Estado
            <select name="estado" value={filters.estado} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {ESTADO_ORDEN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Técnico
            <select name="tecnico_id" value={filters.tecnico_id} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Equipo
          <div className="combo-field">
            <input
              type="text"
              placeholder="Buscar equipo para filtrar"
              value={filterEquipoSearch}
              onChange={(event) => handleFilterEquipoSearchChange(event.target.value)}
              onFocus={() => setFilterEquipoDropdownOpen(true)}
              onBlur={() => {
                setTimeout(() => {
                  setFilterEquipoDropdownOpen(false);
                }, 120);
              }}
            />
            {filterEquipoDropdownOpen && (
              <div className="combo-dropdown" role="listbox" aria-label="Equipos para filtrar">
                <button
                  type="button"
                  className="combo-option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setFilters((previous) => ({ ...previous, equipo_id: '' }));
                    setFilterEquipoSearch('');
                    setFilterEquipoDropdownOpen(false);
                  }}
                >
                  Todos
                </button>
                {filteredEquiposForFilters.length === 0 ? (
                  <div className="combo-empty">Sin coincidencias</div>
                ) : (
                  filteredEquiposForFilters.map((equipo) => (
                    <button
                      key={equipo.id}
                      type="button"
                      className="combo-option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectFilterEquipo(equipo)}
                    >
                      {getEquipoLabel(equipo)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </label>

        <div className="row-actions">
          <button type="submit">Aplicar filtros</button>
          <button type="button" onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </form>

      {(canCreate || (editingId && canUpdate)) ? (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? `Editar orden OT-${editingId}` : 'Nueva orden'}</h2>

          <div className="form-row-2">
            <label>
              Equipo
              <div className="combo-field">
                <input
                  type="text"
                  placeholder="Buscar y seleccionar equipo"
                  value={equipoSearch}
                  onChange={(event) => handleEquipoSearchChange(event.target.value)}
                  onFocus={() => setEquipoDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setEquipoDropdownOpen(false);
                    }, 120);
                  }}
                />
                {equipoDropdownOpen && (
                  <div className="combo-dropdown" role="listbox" aria-label="Equipos disponibles">
                    {filteredEquiposForForm.length === 0 ? (
                      <div className="combo-empty">Sin coincidencias</div>
                    ) : (
                      filteredEquiposForForm.map((equipo) => (
                        <button
                          key={equipo.id}
                          type="button"
                          className="combo-option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectEquipo(equipo)}
                        >
                          {getEquipoLabel(equipo)}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>

            <label>
              Técnico asignado
              <select
                name="tecnico_asignado"
                value={form.tecnico_asignado}
                onChange={handleFormChange}
              >
                <option value="">Sin asignar</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Descripción de falla
            <textarea
              name="descripcion_falla"
              value={form.descripcion_falla}
              onChange={handleFormChange}
              rows={3}
              required
            />
          </label>

          <div className="form-row-2">
            <label>
              Diagnóstico
              <textarea
                name="diagnostico"
                value={form.diagnostico}
                onChange={handleFormChange}
                rows={3}
              />
            </label>

            <label>
              Solución
              <textarea
                name="solucion"
                value={form.solucion}
                onChange={handleFormChange}
                rows={3}
              />
            </label>
          </div>

          <div className="form-row-2">
            <label>
              Costo estimado
              <input
                name="costo_estimado"
                type="number"
                min="0"
                step="0.01"
                value={form.costo_estimado}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Costo final
              <input
                name="costo_final"
                type="number"
                min="0"
                step="0.01"
                value={form.costo_final}
                onChange={handleFormChange}
              />
            </label>
          </div>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={handleFormChange}>
              {ESTADO_ORDEN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="row-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      ) : (
        <p>No tienes permisos de creación/edición en órdenes.</p>
      )}

      {message && <p>{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="card table-wrapper">
        {loading ? (
          <p>Cargando órdenes...</p>
        ) : (
          <>
            <TableControls
              searchValue={tableSearch}
              onSearchChange={(value) => {
                setTableSearch(value);
                setTablePage(1);
              }}
              searchPlaceholder="Buscar en OT, cliente, equipo, estado, técnico o falla"
              totalItems={tableView.totalItems}
              currentPage={tableView.currentPage}
              totalPages={tableView.totalPages}
              pageSize={tablePageSize}
              onPageSizeChange={(size) => {
                setTablePageSize(size);
                setTablePage(1);
              }}
              onPrevPage={() => setTablePage((previous) => Math.max(1, previous - 1))}
              onNextPage={() =>
                setTablePage((previous) => Math.min(tableView.totalPages, previous + 1))
              }
              onExportCsv={exportOrdenesCsv}
            />

            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Costos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tableView.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay órdenes para mostrar.</td>
                  </tr>
                ) : (
                  tableView.pagedItems.map((orden) => (
                    <Fragment key={orden.id}>
                      <tr>
                        <td>{`OT-${orden.id}`}</td>
                        <td>{`${orden.cliente_nombre || ''} ${orden.cliente_apellido || ''}`.trim()}</td>
                        <td>{`${orden.equipo_marca || ''} ${orden.equipo_modelo || ''}`.trim()}</td>
                        <td>
                          {canUpdate ? (
                            <div className="inline-status-editor">
                              <select
                                value={getDraftEstado(orden)}
                                onChange={(event) => onChangeDraftEstado(orden.id, event.target.value)}
                                disabled={pendingActionKeys.has(`orden-estado-${orden.id}`)}
                              >
                                {ESTADO_ORDEN_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeferredEstadoChange(orden)}
                                disabled={
                                  pendingActionKeys.has(`orden-estado-${orden.id}`) ||
                                  getDraftEstado(orden) === orden.estado
                                }
                              >
                                {pendingActionKeys.has(`orden-estado-${orden.id}`)
                                  ? 'Pendiente...'
                                  : 'Aplicar'}
                              </button>
                            </div>
                          ) : (
                            getLabelByValue(ESTADO_ORDEN_OPTIONS, orden.estado, orden.estado)
                          )}
                        </td>
                        <td>{getTecnicoLabel(orden.tecnico_asignado)}</td>
                        <td>{`Est: ${orden.costo_estimado} | Fin: ${orden.costo_final}`}</td>
                        <td>
                          {canUpdate && (
                            <button type="button" onClick={() => handleEdit(orden)}>
                              Editar
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(orden)}
                              disabled={pendingDeleteKeys.has(`orden-${orden.id}`)}
                            >
                              {pendingDeleteKeys.has(`orden-${orden.id}`) ? 'Pendiente...' : 'Eliminar'}
                            </button>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="7">
                          <strong>Historial:</strong>{' '}
                          {orden.historial?.length ? (
                            orden.historial.map((item) => (
                              <div key={item.id}>
                                {`${item.estado_anterior || '-'} → ${item.estado_nuevo} | ${item.usuario_username || 'sistema'} | ${new Date(item.fecha).toLocaleString()}`}
                              </div>
                            ))
                          ) : (
                            <span>Sin registros.</span>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </section>
  );
}

export default OrdenesPage;

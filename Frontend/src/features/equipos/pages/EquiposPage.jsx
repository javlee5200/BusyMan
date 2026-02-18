import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listClientes } from '../../clientes/clientesService';
import TableControls from '../../../shared/components/TableControls';
import { useDeferredDelete } from '../../../shared/hooks/useDeferredDelete';
import {
  ESTADO_ORDEN_OPTIONS,
  TIPO_EQUIPO_OPTIONS,
  getLabelByValue,
} from '../../../shared/utils/catalogLabels';
import { exportToCsv } from '../../../shared/utils/csvUtils';
import { searchAndPaginate } from '../../../shared/utils/tableUtils';
import {
  createEquipo,
  deleteEquipo,
  listEquipos,
  updateEquipo,
} from '../equiposService';

const initialForm = {
  cliente: '',
  tipo_equipo: 'PORTATIL',
  marca: '',
  modelo: '',
  numero_serie: '',
  accesorios_recibidos: '',
  estado_fisico: '',
  problema_reportado: '',
  estado_actual: 'INGRESADO',
};

const initialFilters = {
  cliente_id: '',
  estado: '',
  tipo_equipo: '',
  numero_serie: '',
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

function getClienteLabel(cliente) {
  return `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
}

function EquiposPage() {
  const { user } = useAuth();
  const { pendingDeleteKeys, requestDeferredDelete } = useDeferredDelete();
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const role = user?.role || '';
  const canWrite = useMemo(
    () => ['Administrador', 'Recepción', 'Recepcion', 'Técnico', 'Tecnico'].includes(role) || !role,
    [role],
  );
  const canDelete = role === 'Administrador' || !role;

  function exportEquiposCsv() {
    exportToCsv({
      fileName: 'equipos',
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'tipo_equipo', label: 'Tipo equipo' },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo' },
        { key: 'numero_serie', label: 'Número serie' },
        { key: 'estado_actual', label: 'Estado actual' },
        { key: 'problema_reportado', label: 'Problema reportado' },
      ],
      rows: tableView.filteredItems.map((item) => ({
        id: item.id,
        cliente: `${item.cliente_nombre || ''} ${item.cliente_apellido || ''}`.trim(),
        tipo_equipo: item.tipo_equipo,
        marca: item.marca,
        modelo: item.modelo || '',
        numero_serie: item.numero_serie || '',
        estado_actual: getLabelByValue(ESTADO_ORDEN_OPTIONS, item.estado_actual, item.estado_actual),
        problema_reportado: item.problema_reportado,
      })),
    });
  }

  const tableView = useMemo(
    () =>
      searchAndPaginate({
        items: equipos,
        query: tableSearch,
        page: tablePage,
        pageSize: tablePageSize,
        matcher: (item, query, normalizeText) => {
          const target = [
            item.id,
            item.cliente_nombre,
            item.cliente_apellido,
            item.tipo_equipo,
            item.marca,
            item.modelo,
            item.numero_serie,
            item.estado_actual,
            item.problema_reportado,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return target.includes(query);
        },
      }),
    [equipos, tablePage, tablePageSize, tableSearch],
  );

  async function loadClientesOptions() {
    try {
      const data = await listClientes();
      setClientes(data);
    } catch {
      setClientes([]);
    }
  }

  async function loadEquipos(activeFilters = filters) {
    setLoading(true);
    setError('');

    const params = {};
    if (activeFilters.cliente_id) params.cliente_id = activeFilters.cliente_id;
    if (activeFilters.estado) params.estado = activeFilters.estado;
    if (activeFilters.tipo_equipo) params.tipo_equipo = activeFilters.tipo_equipo;
    if (activeFilters.numero_serie) params.numero_serie = activeFilters.numero_serie;

    try {
      const data = await listEquipos(params);
      setEquipos(data);
      setTablePage(1);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientesOptions();
    loadEquipos(initialFilters);
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      ...form,
      cliente: Number(form.cliente),
      numero_serie: form.numero_serie || null,
    };

    try {
      if (editingId) {
        await updateEquipo(editingId, payload);
        setMessage('Equipo actualizado correctamente.');
      } else {
        await createEquipo(payload);
        setMessage('Equipo creado correctamente.');
      }

      resetForm();
      await loadEquipos();
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(equipo) {
    setForm({
      cliente: String(equipo.cliente || ''),
      tipo_equipo: equipo.tipo_equipo || 'PORTATIL',
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      numero_serie: equipo.numero_serie || '',
      accesorios_recibidos: equipo.accesorios_recibidos || '',
      estado_fisico: equipo.estado_fisico || '',
      problema_reportado: equipo.problema_reportado || '',
      estado_actual: equipo.estado_actual || 'INGRESADO',
    });
    setEditingId(equipo.id);
    setMessage('');
    setError('');
  }

  async function handleDelete(equipo) {
    setError('');
    setMessage('');

    await requestDeferredDelete({
      deleteKey: `equipo-${equipo.id}`,
      confirmTitle: 'Eliminar equipo',
      confirmMessage: `¿Eliminar equipo ${equipo.marca} ${equipo.modelo || ''} (${equipo.numero_serie || 'sin serie'})?`,
      undoLabel: `Equipo ${equipo.marca} ${equipo.modelo || ''}`,
      successMessage: 'Equipo eliminado correctamente.',
      onCommit: async () => {
        await deleteEquipo(equipo.id);
        await loadEquipos();
      },
    });
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadEquipos(filters);
  }

  async function clearFilters() {
    setFilters(initialFilters);
    await loadEquipos(initialFilters);
  }

  return (
    <section>
      <h1>Equipos</h1>
      <p>Gestión de equipos conectada a la API `/api/equipos/`.</p>

      <form className="card form-grid" onSubmit={applyFilters}>
        <h2>Filtros</h2>
        <div className="form-row-2">
          <label>
            Cliente
            <select name="cliente_id" value={filters.cliente_id} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {getClienteLabel(cliente)}
                </option>
              ))}
            </select>
          </label>

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
        </div>

        <div className="form-row-2">
          <label>
            Tipo de equipo
            <select name="tipo_equipo" value={filters.tipo_equipo} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {TIPO_EQUIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Número de serie
            <input
              name="numero_serie"
              value={filters.numero_serie}
              onChange={handleFilterChange}
              placeholder="Coincidencia parcial"
            />
          </label>
        </div>

        <div className="row-actions">
          <button type="submit">Aplicar filtros</button>
          <button type="button" onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </form>

      {canWrite ? (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar equipo' : 'Nuevo equipo'}</h2>

          <div className="form-row-2">
            <label>
              Cliente
              <select name="cliente" value={form.cliente} onChange={handleFormChange} required>
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {getClienteLabel(cliente)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tipo de equipo
              <select name="tipo_equipo" value={form.tipo_equipo} onChange={handleFormChange}>
                {TIPO_EQUIPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row-2">
            <label>
              Marca
              <input name="marca" value={form.marca} onChange={handleFormChange} required />
            </label>

            <label>
              Modelo
              <input name="modelo" value={form.modelo} onChange={handleFormChange} />
            </label>
          </div>

          <div className="form-row-2">
            <label>
              Número de serie
              <input name="numero_serie" value={form.numero_serie} onChange={handleFormChange} />
            </label>

            <label>
              Estado actual
              <select name="estado_actual" value={form.estado_actual} onChange={handleFormChange}>
                {ESTADO_ORDEN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Accesorios recibidos
            <input
              name="accesorios_recibidos"
              value={form.accesorios_recibidos}
              onChange={handleFormChange}
            />
          </label>

          <label>
            Estado físico
            <input name="estado_fisico" value={form.estado_fisico} onChange={handleFormChange} />
          </label>

          <label>
            Problema reportado
            <input
              name="problema_reportado"
              value={form.problema_reportado}
              onChange={handleFormChange}
              required
            />
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
        <p>No tienes permisos de escritura en equipos.</p>
      )}

      {message && <p>{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="card table-wrapper">
        {loading ? (
          <p>Cargando equipos...</p>
        ) : (
          <>
            <TableControls
              searchValue={tableSearch}
              onSearchChange={(value) => {
                setTableSearch(value);
                setTablePage(1);
              }}
              searchPlaceholder="Buscar en cliente, marca, modelo, serie, estado o problema"
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
              onExportCsv={exportEquiposCsv}
            />

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Serie</th>
                  <th>Estado</th>
                  <th>Problema</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tableView.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay equipos para mostrar.</td>
                  </tr>
                ) : (
                  tableView.pagedItems.map((equipo) => (
                    <tr key={equipo.id}>
                      <td>{equipo.id}</td>
                      <td>{`${equipo.cliente_nombre || ''} ${equipo.cliente_apellido || ''}`.trim()}</td>
                      <td>
                        {`${getLabelByValue(TIPO_EQUIPO_OPTIONS, equipo.tipo_equipo, equipo.tipo_equipo)} - ${equipo.marca} ${equipo.modelo || ''}`}
                      </td>
                      <td>{equipo.numero_serie || '-'}</td>
                      <td>
                        {getLabelByValue(ESTADO_ORDEN_OPTIONS, equipo.estado_actual, equipo.estado_actual)}
                      </td>
                      <td>{equipo.problema_reportado}</td>
                      <td>
                        {canWrite && (
                          <button type="button" onClick={() => handleEdit(equipo)}>
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(equipo)}
                            disabled={pendingDeleteKeys.has(`equipo-${equipo.id}`)}
                          >
                            {pendingDeleteKeys.has(`equipo-${equipo.id}`) ? 'Pendiente...' : 'Eliminar'}
                          </button>
                        )}
                      </td>
                    </tr>
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

export default EquiposPage;

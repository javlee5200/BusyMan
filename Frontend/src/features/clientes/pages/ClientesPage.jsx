import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import TableControls from '../../../shared/components/TableControls';
import { useDeferredDelete } from '../../../shared/hooks/useDeferredDelete';
import {
  TIPO_DOCUMENTO_OPTIONS,
  getLabelByValue,
} from '../../../shared/utils/catalogLabels';
import { exportToCsv } from '../../../shared/utils/csvUtils';
import { searchAndPaginate } from '../../../shared/utils/tableUtils';
import {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from '../clientesService';

const initialForm = {
  nombres: '',
  apellidos: '',
  tipo_documento: 'CC',
  numero_documento: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
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

function ClientesPage() {
  const { user } = useAuth();
  const { pendingDeleteKeys, requestDeferredDelete } = useDeferredDelete();
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canWrite = useMemo(() => {
    if (!user?.role) return true;
    return ['Administrador', 'Recepción', 'Recepcion'].includes(user.role);
  }, [user?.role]);

  const canDelete = user?.role === 'Administrador' || !user?.role;

  function exportClientesCsv() {
    exportToCsv({
      fileName: 'clientes',
      headers: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo_documento', label: 'Tipo documento' },
        { key: 'numero_documento', label: 'Número documento' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'direccion', label: 'Dirección' },
        { key: 'activo', label: 'Activo' },
      ],
      rows: tableView.filteredItems.map((item) => ({
        id: item.id,
        nombre: `${item.nombres || ''} ${item.apellidos || ''}`.trim(),
        tipo_documento: item.tipo_documento,
        numero_documento: item.numero_documento,
        telefono: item.telefono,
        email: item.email || '',
        direccion: item.direccion || '',
        activo: item.activo ? 'Sí' : 'No',
      })),
    });
  }

  const tableView = useMemo(
    () =>
      searchAndPaginate({
        items: clientes,
        query: tableSearch,
        page: tablePage,
        pageSize: tablePageSize,
        matcher: (item, query, normalizeText) => {
          const fullName = `${item.nombres || ''} ${item.apellidos || ''}`;
          const searchTarget = [
            item.id,
            fullName,
            item.tipo_documento,
            item.numero_documento,
            item.telefono,
            item.email,
            item.direccion,
          ]
            .map((value) => normalizeText(value))
            .join(' ');

          return searchTarget.includes(query);
        },
      }),
    [clientes, tablePage, tablePageSize, tableSearch],
  );

  async function loadClientes() {
    setLoading(true);
    setError('');

    try {
      const data = await listClientes();
      setClientes(data);
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

    try {
      if (editingId) {
        await updateCliente(editingId, form);
        setMessage('Cliente actualizado correctamente.');
      } else {
        await createCliente(form);
        setMessage('Cliente creado correctamente.');
      }

      resetForm();
      await loadClientes();
    } catch (requestError) {
      setError(extractApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(cliente) {
    setForm({
      nombres: cliente.nombres || '',
      apellidos: cliente.apellidos || '',
      tipo_documento: cliente.tipo_documento || 'CC',
      numero_documento: cliente.numero_documento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      activo: Boolean(cliente.activo),
    });
    setEditingId(cliente.id);
    setMessage('');
    setError('');
  }

  async function handleDelete(cliente) {
    setError('');
    setMessage('');

    await requestDeferredDelete({
      deleteKey: `cliente-${cliente.id}`,
      confirmTitle: 'Eliminar cliente',
      confirmMessage: `¿Eliminar al cliente ${cliente.nombres} ${cliente.apellidos}?`,
      undoLabel: `Cliente ${cliente.nombres} ${cliente.apellidos}`,
      successMessage: 'Cliente eliminado correctamente.',
      onCommit: async () => {
        await deleteCliente(cliente.id);
        await loadClientes();
      },
    });
  }

  return (
    <section>
      <h1>Clientes</h1>
      <p>Gestión de clientes conectada a la API `/api/clientes/`.</p>

      {canWrite ? (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>

          <div className="form-row-2">
            <label>
              Nombres
              <input name="nombres" value={form.nombres} onChange={handleInputChange} required />
            </label>
            <label>
              Apellidos
              <input name="apellidos" value={form.apellidos} onChange={handleInputChange} required />
            </label>
          </div>

          <div className="form-row-2">
            <label>
              Tipo documento
              <select name="tipo_documento" value={form.tipo_documento} onChange={handleInputChange}>
                {TIPO_DOCUMENTO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Número documento
              <input
                name="numero_documento"
                value={form.numero_documento}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>

          <div className="form-row-2">
            <label>
              Teléfono
              <input name="telefono" value={form.telefono} onChange={handleInputChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleInputChange} />
            </label>
          </div>

          <label>
            Dirección
            <input name="direccion" value={form.direccion} onChange={handleInputChange} />
          </label>

          <label className="checkbox-inline">
            <input
              name="activo"
              type="checkbox"
              checked={form.activo}
              onChange={handleInputChange}
            />
            Cliente activo
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
        <p>No tienes permisos de escritura en clientes.</p>
      )}

      {message && <p>{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="card table-wrapper">
        {loading ? (
          <p>Cargando clientes...</p>
        ) : (
          <>
            <TableControls
              searchValue={tableSearch}
              onSearchChange={(value) => {
                setTableSearch(value);
                setTablePage(1);
              }}
              searchPlaceholder="Buscar por nombre, documento, teléfono o email"
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
              onExportCsv={exportClientesCsv}
            />

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tableView.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay clientes para mostrar.</td>
                  </tr>
                ) : (
                  tableView.pagedItems.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.id}</td>
                      <td>{`${cliente.nombres} ${cliente.apellidos}`}</td>
                      <td>
                        {`${getLabelByValue(TIPO_DOCUMENTO_OPTIONS, cliente.tipo_documento, cliente.tipo_documento)} ${cliente.numero_documento}`}
                      </td>
                      <td>{cliente.telefono}</td>
                      <td>{cliente.email || '-'}</td>
                      <td>{cliente.activo ? 'Sí' : 'No'}</td>
                      <td>
                        {canWrite && (
                          <button type="button" onClick={() => handleEdit(cliente)}>
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(cliente)}
                            disabled={pendingDeleteKeys.has(`cliente-${cliente.id}`)}
                          >
                            {pendingDeleteKeys.has(`cliente-${cliente.id}`)
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
          </>
        )}
      </div>
    </section>
  );
}

export default ClientesPage;

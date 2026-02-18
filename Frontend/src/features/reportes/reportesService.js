import apiClient from '../../shared/services/apiClient';

function buildDateParams(filters = {}) {
  const params = {};
  if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
  if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
  return params;
}

export async function getOrdenesPorEstado(filters = {}) {
  const { data } = await apiClient.get('/api/reportes/ordenes-por-estado/', {
    params: buildDateParams(filters),
  });
  return Array.isArray(data) ? data : [];
}

export async function getOrdenesPorTecnico(filters = {}) {
  const { data } = await apiClient.get('/api/reportes/ordenes-por-tecnico/', {
    params: buildDateParams(filters),
  });
  return Array.isArray(data) ? data : [];
}

export async function getConsumoRepuestos(filters = {}) {
  const { data } = await apiClient.get('/api/reportes/consumo-repuestos/', {
    params: buildDateParams(filters),
  });
  return Array.isArray(data) ? data : [];
}

import apiClient from '../../shared/services/apiClient';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listOrdenes(params = {}) {
  const { data } = await apiClient.get('/api/ordenes/', { params });
  return normalizeListResponse(data);
}

export async function createOrden(payload) {
  const { data } = await apiClient.post('/api/ordenes/', payload);
  return data;
}

export async function updateOrden(ordenId, payload) {
  const { data } = await apiClient.patch(`/api/ordenes/${ordenId}/`, payload);
  return data;
}

export async function deleteOrden(ordenId) {
  await apiClient.delete(`/api/ordenes/${ordenId}/`);
}

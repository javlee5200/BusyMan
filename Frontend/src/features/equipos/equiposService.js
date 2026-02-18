import apiClient from '../../shared/services/apiClient';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listEquipos(params = {}) {
  const { data } = await apiClient.get('/api/equipos/', { params });
  return normalizeListResponse(data);
}

export async function createEquipo(payload) {
  const { data } = await apiClient.post('/api/equipos/', payload);
  return data;
}

export async function updateEquipo(equipoId, payload) {
  const { data } = await apiClient.patch(`/api/equipos/${equipoId}/`, payload);
  return data;
}

export async function deleteEquipo(equipoId) {
  await apiClient.delete(`/api/equipos/${equipoId}/`);
}

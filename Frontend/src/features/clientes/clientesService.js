import apiClient from '../../shared/services/apiClient';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listClientes(params = {}) {
  const { data } = await apiClient.get('/api/clientes/', { params });
  return normalizeListResponse(data);
}

export async function createCliente(payload) {
  const { data } = await apiClient.post('/api/clientes/', payload);
  return data;
}

export async function updateCliente(clienteId, payload) {
  const { data } = await apiClient.patch(`/api/clientes/${clienteId}/`, payload);
  return data;
}

export async function deleteCliente(clienteId) {
  await apiClient.delete(`/api/clientes/${clienteId}/`);
}

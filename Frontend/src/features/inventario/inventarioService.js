import apiClient from '../../shared/services/apiClient';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listRepuestos(params = {}) {
  const { data } = await apiClient.get('/api/repuestos/', { params });
  return normalizeListResponse(data);
}

export async function createRepuesto(payload) {
  const { data } = await apiClient.post('/api/repuestos/', payload);
  return data;
}

export async function updateRepuesto(repuestoId, payload) {
  const { data } = await apiClient.patch(`/api/repuestos/${repuestoId}/`, payload);
  return data;
}

export async function deleteRepuesto(repuestoId) {
  await apiClient.delete(`/api/repuestos/${repuestoId}/`);
}

export async function listMovimientos(params = {}) {
  const { data } = await apiClient.get('/api/inventario/movimientos/', { params });
  return normalizeListResponse(data);
}

export async function createMovimiento(payload) {
  const { data } = await apiClient.post('/api/inventario/movimientos/', payload);
  return data;
}

export async function updateMovimiento(movimientoId, payload) {
  const { data } = await apiClient.patch(`/api/inventario/movimientos/${movimientoId}/`, payload);
  return data;
}

export async function deleteMovimiento(movimientoId) {
  await apiClient.delete(`/api/inventario/movimientos/${movimientoId}/`);
}

export async function listConsumos(params = {}) {
  const { data } = await apiClient.get('/api/inventario/consumos/', { params });
  return normalizeListResponse(data);
}

export async function createConsumo(payload) {
  const { data } = await apiClient.post('/api/inventario/consumos/', payload);
  return data;
}

export async function updateConsumo(consumoId, payload) {
  const { data } = await apiClient.patch(`/api/inventario/consumos/${consumoId}/`, payload);
  return data;
}

export async function deleteConsumo(consumoId) {
  await apiClient.delete(`/api/inventario/consumos/${consumoId}/`);
}

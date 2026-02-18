import apiClient from '../../shared/services/apiClient';

export async function listTecnicos() {
  const { data } = await apiClient.get('/api/usuarios/tecnicos/');
  return Array.isArray(data) ? data : [];
}

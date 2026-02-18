import apiClient from '../../shared/services/apiClient';
import { clearTokens, setTokens } from '../../shared/services/tokenStorage';

export async function loginRequest(credentials) {
  const { data } = await apiClient.post('/api/auth/token/', credentials);
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export function logoutRequest() {
  clearTokens();
}

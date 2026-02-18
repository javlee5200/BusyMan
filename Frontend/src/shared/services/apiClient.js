import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';
import { emitHttpError } from './httpFeedbackBus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePending(error, token = null) {
  pendingQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  pendingQueue = [];
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const requestUrl = originalRequest?.url || '';
    const isAuthTokenRequest = requestUrl.includes('/api/auth/token/');
    const isAuthRefreshRequest = requestUrl.includes('/api/auth/token/refresh/');

    if (!isUnauthorized || originalRequest._retry) {
      emitHttpError(error);
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      if (!isAuthTokenRequest && !isAuthRefreshRequest) {
        emitHttpError(error);
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await refreshClient.post('/api/auth/token/refresh/', {
        refresh: refreshToken,
      });

      setTokens({ access: data.access, refresh: refreshToken });
      resolvePending(null, data.access);

      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      resolvePending(refreshError, null);
      emitHttpError(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;

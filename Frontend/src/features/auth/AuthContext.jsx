import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAccessToken, getRefreshToken } from '../../shared/services/tokenStorage';
import { getRoleFromToken } from './utils/jwt';
import { loginRequest, logoutRequest } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && refreshToken) {
      setIsAuthenticated(true);
      setUser((previous) => ({
        username: previous?.username || 'usuario',
        role: getRoleFromToken(accessToken),
      }));
    }

    setIsLoading(false);
  }, []);

  async function login({ username, password }) {
    const data = await loginRequest({ username, password });
    setIsAuthenticated(true);
    setUser({
      username,
      role: getRoleFromToken(data.access),
    });
  }

  function logout() {
    logoutRequest();
    setIsAuthenticated(false);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

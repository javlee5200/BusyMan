import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NotificationCenter from '../components/NotificationCenter';
import { setHttpErrorHandler } from '../services/httpFeedbackBus';

const NotificationContext = createContext(null);

function mapHttpErrorToMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return 'Sesión no válida o expirada. Inicia sesión nuevamente.';
  }

  if (status === 403) {
    return data?.detail || 'No tienes permisos para realizar esta acción.';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data && typeof data === 'object') {
    const firstField = Object.keys(data)[0];
    const fieldValue = data[firstField];
    if (Array.isArray(fieldValue) && fieldValue[0]) {
      return `${firstField}: ${fieldValue[0]}`;
    }
  }

  return 'Ocurrió un error al comunicarse con el servidor.';
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  function closeNotification(id) {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  function pushNotification(type, message, options = {}) {
    const duration = options.duration ?? 4500;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((previous) => [
      ...previous,
      {
        id,
        type,
        message,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      },
    ]);

    window.setTimeout(() => {
      closeNotification(id);
    }, duration);
  }

  useEffect(() => {
    function onError(error) {
      if (error?.config?.skipGlobalError) {
        return;
      }

      pushNotification('error', mapHttpErrorToMessage(error));
    }

    setHttpErrorHandler(onError);
    return () => setHttpErrorHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess: (message, options) => pushNotification('success', message, options),
      notifyError: (message, options) => pushNotification('error', message, options),
      notifyInfo: (message, options) => pushNotification('info', message, options),
    }),
    [],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationCenter items={items} onClose={closeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }

  return context;
}

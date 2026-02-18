import { createContext, useContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfirmContext = createContext(null);

const initialDialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
};

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState(initialDialogState);
  const resolverRef = useRef(null);

  function cleanup(result) {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialogState(initialDialogState);
  }

  function confirm(options) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        title: options?.title || 'Confirmación',
        message: options?.message || '¿Deseas continuar?',
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
      });
    });
  }

  const value = useMemo(
    () => ({
      confirm,
    }),
    [],
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={() => cleanup(true)}
        onCancel={() => cleanup(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  }

  return context;
}

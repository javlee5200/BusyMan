import { useRef, useState } from 'react';
import { useConfirm } from '../confirm/ConfirmContext';
import { useNotification } from '../notifications/NotificationContext';

const UNDO_WINDOW_MS = 5000;

export function useDeferredDelete() {
  const { confirm } = useConfirm();
  const { notifyInfo, notifySuccess } = useNotification();
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState(new Set());
  const timersRef = useRef(new Map());

  async function requestDeferredDelete({
    deleteKey,
    confirmTitle,
    confirmMessage,
    undoLabel,
    successMessage,
    onCommit,
  }) {
    const key = String(deleteKey);

    if (timersRef.current.has(key)) {
      return;
    }

    const accepted = await confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!accepted) return;

    setPendingDeleteKeys((previous) => {
      const next = new Set(previous);
      next.add(key);
      return next;
    });

    const timeoutId = window.setTimeout(async () => {
      try {
        await onCommit();
        if (successMessage) {
          notifySuccess(successMessage);
        }
      } finally {
        timersRef.current.delete(key);
        setPendingDeleteKeys((previous) => {
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      }
    }, UNDO_WINDOW_MS);

    timersRef.current.set(key, timeoutId);

    notifyInfo(`${undoLabel} se eliminará en 5 segundos.`, {
      duration: UNDO_WINDOW_MS,
      actionLabel: 'Deshacer',
      onAction: () => {
        const timer = timersRef.current.get(key);
        if (timer) {
          window.clearTimeout(timer);
          timersRef.current.delete(key);
        }

        setPendingDeleteKeys((previous) => {
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      },
    });
  }

  return {
    pendingDeleteKeys,
    requestDeferredDelete,
  };
}

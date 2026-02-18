function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="confirm-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

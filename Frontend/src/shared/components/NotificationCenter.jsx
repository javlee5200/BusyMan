function NotificationCenter({ items, onClose }) {
  return (
    <div className="notification-center" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`notification-item notification-${item.type}`}>
          <div className="notification-content">
            <span>{item.message}</span>
            {item.actionLabel && (
              <button
                type="button"
                className="notification-action"
                onClick={() => {
                  item.onAction?.();
                  onClose(item.id);
                }}
              >
                {item.actionLabel}
              </button>
            )}
          </div>
          <button type="button" onClick={() => onClose(item.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;

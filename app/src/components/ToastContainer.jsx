import { useEffect } from "react";

/**
 * Renders a stack of toast notifications.
 * Each toast: { id, message, type?: "info"|"warning"|"error"|"success", duration? }
 */
export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const dur = toast.duration || 5000;
    const timer = setTimeout(() => onDismiss(toast.id), dur);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast toast-${toast.type || "info"}`}>
      <span className="toast-icon">
        {toast.type === "warning" ? "⚠️" : toast.type === "error" ? "❌" : toast.type === "success" ? "✅" : "ℹ️"}
      </span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>✕</button>
    </div>
  );
}

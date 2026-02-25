export default function ConfirmDeleteModal({ taskTitle, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">Delete Task?</div>
        <div className="confirm-msg">
          This action cannot be undone.
          <span className="confirm-task-name">"{taskTitle}"</span>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-btn delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

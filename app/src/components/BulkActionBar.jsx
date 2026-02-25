import { COLUMNS, TASK_TYPES } from "../constants";

export default function BulkActionBar({
  selectedCount, totalCount,
  onSelectAll, onDeselectAll, onExit,
  onDelete, onMove, onEditField,
}) {
  if (selectedCount === 0 && !totalCount) return null;

  return (
    <div className="bulk-bar">
      <div className="bulk-bar-left">
        <span className="bulk-count">
          {selectedCount} selected
        </span>
        <button className="bulk-link" onClick={selectedCount < totalCount ? onSelectAll : onDeselectAll}>
          {selectedCount < totalCount ? "Select all" : "Deselect all"}
        </button>
      </div>

      <div className="bulk-bar-actions">
        {/* Move to column */}
        <select
          className="bulk-select"
          defaultValue=""
          onChange={(e) => { if (e.target.value) onMove(e.target.value); e.target.value = ""; }}
          disabled={selectedCount === 0}
        >
          <option value="" disabled>Move to…</option>
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>→ {c.label}</option>
          ))}
        </select>

        {/* Change priority */}
        <select
          className="bulk-select"
          defaultValue=""
          onChange={(e) => { if (e.target.value) onEditField("priority", e.target.value); e.target.value = ""; }}
          disabled={selectedCount === 0}
        >
          <option value="" disabled>Priority…</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Change type */}
        <select
          className="bulk-select"
          defaultValue=""
          onChange={(e) => { if (e.target.value) onEditField("type", e.target.value); e.target.value = ""; }}
          disabled={selectedCount === 0}
        >
          <option value="" disabled>Type…</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Delete */}
        <button
          className="bulk-btn delete"
          onClick={onDelete}
          disabled={selectedCount === 0}
        >
          🗑 Delete ({selectedCount})
        </button>
      </div>

      <button className="bulk-exit" onClick={onExit} title="Exit select mode">✕</button>
    </div>
  );
}

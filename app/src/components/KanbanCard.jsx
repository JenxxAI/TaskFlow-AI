import { TYPE_COLORS, PRIORITY_META, COLUMNS } from "../constants";
import { isOverdue, isDueToday, formatDate } from "../utils";

export default function KanbanCard({ task, theme, onDragStart, onDelete, onEdit, onMove }) {
  const tc = TYPE_COLORS[theme][task.type] || TYPE_COLORS[theme]["Daily To-Do"];
  const overdue  = isOverdue(task.due) && task.col !== "done";
  const dueToday = isDueToday(task.due) && task.col !== "done";

  return (
    <div
      className={`card${overdue ? " overdue" : ""}${dueToday && !overdue ? " due-today" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <div className="card-actions">
        <button className="card-btn" onClick={() => onEdit(task)}>✎</button>
        <button className="card-btn del" onClick={() => onDelete(task.id, task.title)}>✕</button>
      </div>
      <div className="card-type-row">
        <span className="type-badge" style={{ background: tc.bg, color: tc.text, borderColor: tc.border }}>
          {task.type}
        </span>
        <span className="priority-pip" style={{ background: PRIORITY_META[task.priority].color }} />
      </div>
      <div className="card-title">{task.title}</div>
      {task.notes   && <div className="card-notes">{task.notes}</div>}
      {task.blocker && <div className="card-blocker"><span>🚧</span><span>{task.blocker}</span></div>}
      {task.subtasks && task.subtasks.length > 0 && (() => {
        const done = task.subtasks.filter(s => s.done).length;
        const total = task.subtasks.length;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="card-subtasks">
            <div className="subtask-progress-bar">
              <div className="subtask-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="subtask-progress-text">☑ {done}/{total}</span>
          </div>
        );
      })()}
      <div className="card-footer">
        {task.due ? (
          <span className={`card-due ${overdue ? "overdue" : dueToday ? "today" : "normal"}`}>
            {overdue ? "⚠ " : dueToday ? "● " : ""}
            {formatDate(task.due)}
            {dueToday ? " — today" : ""}
          </span>
        ) : (
          <span />
        )}
      </div>
      {/* Mobile move-to-column fallback */}
      <div className="card-move">
        <select className="card-move-select" value={task.col} onChange={(e) => onMove(task.id, e.target.value)}>
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>→ {c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

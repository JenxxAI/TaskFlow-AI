import { useState } from "react";
import KanbanCard from "./KanbanCard";
import AddCardForm from "./AddCardForm";

export default function KanbanColumn({ col, tasks, theme, onDragStart, onDrop, onDragOver, onDragLeave, isOver, onDelete, onEdit, onAdd, onMove }) {
  const [adding, setAdding] = useState(false);

  return (
    <div
      className={`column${isOver ? " drag-over" : ""}`}
      data-col-id={col.id}
      onDrop={(e) => onDrop(e, col.id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="col-header">
        <span className="col-dot" style={{ background: col.color }} />
        <span className="col-title">{col.label}</span>
        <span className="col-count">{tasks.length}</span>
      </div>
      <div className="col-body">
        {tasks.map((t) => (
          <KanbanCard
            key={t.id} task={t} theme={theme}
            onDragStart={onDragStart} onDelete={onDelete}
            onEdit={onEdit} onMove={onMove}
          />
        ))}
        {adding ? (
          <AddCardForm
            onSave={(d) => { onAdd(col.id, d); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className="add-btn" onClick={() => setAdding(true)}>+ add task</button>
        )}
      </div>
    </div>
  );
}

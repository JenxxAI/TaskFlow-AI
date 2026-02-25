import { useState } from "react";
import { TASK_TYPES } from "../constants";
import { newId } from "../utils";

export default function EditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ ...task, subtasks: task.subtasks || [] });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [subtaskInput, setSubtaskInput] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="modal-drag-handle" />
        <div className="modal-title">Edit Task</div>
        <div>
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="form-row">
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Extra context..." />
        </div>
        <div>
          <label className="form-label">🚧 Blocker</label>
          <textarea className="form-textarea" value={form.blocker} onChange={(e) => set("blocker", e.target.value)} style={{ minHeight: 44 }} placeholder="What's blocking?" />
        </div>
        <div className="subtask-editor">
          <label className="form-label">☑ Checklist</label>
          <div className="subtask-add-row">
            <input
              className="form-input" placeholder="Add subtask..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && subtaskInput.trim()) {
                  e.preventDefault();
                  set("subtasks", [...form.subtasks, { id: newId(), text: subtaskInput.trim(), done: false }]);
                  setSubtaskInput("");
                }
              }}
            />
            <button type="button" className="subtask-add-btn" onClick={() => {
              if (subtaskInput.trim()) {
                set("subtasks", [...form.subtasks, { id: newId(), text: subtaskInput.trim(), done: false }]);
                setSubtaskInput("");
              }
            }}>+</button>
          </div>
          {form.subtasks.map((st) => (
            <div className="subtask-item" key={st.id}>
              <input type="checkbox" className="subtask-check" checked={st.done}
                onChange={() => set("subtasks", form.subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s))} />
              <span className={`subtask-text${st.done ? " done" : ""}`}>{st.text}</span>
              <button className="subtask-remove" onClick={() => set("subtasks", form.subtasks.filter(s => s.id !== st.id))}>✕</button>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-save" onClick={() => onSave(form)}>Save</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

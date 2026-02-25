import { useState } from "react";
import { TASK_TYPES } from "../constants";
import { todayStr, newId } from "../utils";

export default function AddCardForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title: "", type: "Daily To-Do", priority: "medium",
    due: todayStr(), notes: "", blocker: "", subtasks: [],
  });
  const [subtaskInput, setSubtaskInput] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => { if (!form.title.trim()) return; onSave(form); };

  return (
    <div className="add-form">
      <input
        className="form-input" autoFocus placeholder="Task title..."
        value={form.title} onChange={(e) => set("title", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <div className="form-row">
        <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
          {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <input className="form-input" type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
      <textarea className="form-textarea" placeholder="Notes (optional)..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      <textarea className="form-textarea" placeholder="🚧 Blocker (optional)..." value={form.blocker} onChange={(e) => set("blocker", e.target.value)} style={{ minHeight: 40 }} />
      <div className="subtask-editor">
        <label className="form-label">Checklist</label>
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
            <span className="subtask-text">{st.text}</span>
            <button className="subtask-remove" onClick={() => set("subtasks", form.subtasks.filter(s => s.id !== st.id))}>✕</button>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn-save" onClick={save}>Add Task</button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

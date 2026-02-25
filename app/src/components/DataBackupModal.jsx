import { useState, useRef } from "react";

export default function DataBackupModal({ tasks, log, theme, onRestore, onClose }) {
  const [status, setStatus] = useState("");
  const [error, setError]   = useState("");
  const fileRef = useRef(null);

  const handleExport = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      tasks,
      log,
      theme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("✓ Backup exported successfully!");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setStatus("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        // Validate structure
        if (!data.tasks || !Array.isArray(data.tasks)) {
          setError("Invalid backup file: missing tasks array.");
          return;
        }
        if (!data.log || typeof data.log !== "object") {
          setError("Invalid backup file: missing log object.");
          return;
        }
        // Validate each task has required fields
        const requiredFields = ["id", "col", "title", "type", "priority"];
        for (const task of data.tasks) {
          for (const field of requiredFields) {
            if (!(field in task)) {
              setError(`Invalid task found: missing "${field}" field.`);
              return;
            }
          }
        }
        onRestore(data);
        setStatus(`✓ Restored ${data.tasks.length} tasks and ${Object.keys(data.log).length} log entries!`);
      } catch {
        setError("Failed to parse backup file. Make sure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ gap: 16 }}>
        <span className="modal-drag-handle" />
        <div className="modal-title">💾 Data Backup & Restore</div>

        <div className="backup-section">
          <div className="backup-label">Export Backup</div>
          <div className="backup-desc">Download all your tasks, daily logs, and settings as a JSON file.</div>
          <button className="btn-save" onClick={handleExport} style={{ marginTop: 8 }}>
            ⬇ Export Backup (.json)
          </button>
        </div>

        <div className="backup-divider" />

        <div className="backup-section">
          <div className="backup-label">Import Backup</div>
          <div className="backup-desc">Restore from a previously exported backup file. This will replace all current data.</div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button className="btn-cancel" onClick={() => fileRef.current?.click()} style={{ marginTop: 8, cursor: "pointer", border: "1px dashed var(--border-card)" }}>
            ⬆ Import Backup (.json)
          </button>
        </div>

        {status && <div className="backup-status">{status}</div>}
        {error && <div className="backup-status error">{error}</div>}

        <div className="backup-info">
          <span>📊 Current data: {tasks.length} tasks · {Object.keys(log).length} log entries</span>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

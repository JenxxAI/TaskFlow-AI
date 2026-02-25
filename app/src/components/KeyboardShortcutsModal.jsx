export default function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: ["N"], desc: "New task in first column" },
    { keys: ["/"], desc: "Focus search bar" },
    { keys: ["1-4"], desc: "Jump to column (mobile: scroll)" },
    { keys: ["B"], desc: "Switch to Board tab" },
    { keys: ["L"], desc: "Switch to Daily Log tab" },
    { keys: ["A"], desc: "Switch to Analytics tab" },
    { keys: ["D"], desc: "Toggle dark/light theme" },
    { keys: ["Ctrl+Z"], desc: "Undo last action" },
    { keys: ["Ctrl+⇧+Z"], desc: "Redo last action" },
    { keys: ["?"], desc: "Show this help" },
    { keys: ["Esc"], desc: "Close modals & search" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <span className="modal-drag-handle" />
        <div className="modal-title">⌨ Keyboard Shortcuts</div>
        <div className="shortcuts-list">
          {shortcuts.map(({ keys, desc }) => (
            <div className="shortcut-row" key={desc}>
              <div className="shortcut-keys">
                {keys.map((k) => <kbd key={k} className="kbd">{k}</kbd>)}
              </div>
              <span className="shortcut-desc">{desc}</span>
            </div>
          ))}
        </div>
        <div className="shortcuts-note">
          Shortcuts are disabled when typing in inputs or textareas.
        </div>
        <div className="form-actions">
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const COLUMNS = [
  { id: "todo",       label: "To Do",       color: "#64748b" },
  { id: "inprogress", label: "In Progress", color: "#f59e0b" },
  { id: "blocked",    label: "Blocked",     color: "#ef4444" },
  { id: "done",       label: "Done",        color: "#22c55e" },
];

export const TASK_TYPES = ["Daily To-Do", "Test Case", "Bug Report", "Learning"];

export const TYPE_COLORS = {
  dark: {
    "Daily To-Do": { bg: "#1e3a5f", text: "#60a5fa", border: "#1d4ed8" },
    "Test Case":   { bg: "#1a3a2a", text: "#4ade80", border: "#15803d" },
    "Bug Report":  { bg: "#3b1a1a", text: "#f87171", border: "#b91c1c" },
    "Learning":    { bg: "#2e1a3b", text: "#c084fc", border: "#7c3aed" },
  },
  light: {
    "Daily To-Do": { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
    "Test Case":   { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
    "Bug Report":  { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
    "Learning":    { bg: "#f3e8ff", text: "#7c3aed", border: "#d8b4fe" },
  },
};

export const PRIORITY_META = {
  high:   { color: "#ef4444", label: "High" },
  medium: { color: "#f59e0b", label: "Med" },
  low:    { color: "#22c55e", label: "Low" },
};

export const STORAGE_KEY = "qe_kanban_tasks_v2";
export const LOG_KEY     = "qe_kanban_log_v2";
export const THEME_KEY   = "qe_kanban_theme";

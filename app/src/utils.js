import { STORAGE_KEY, LOG_KEY, THEME_KEY } from "./constants";

// ─── ID Generator ─────────────────────────────────────────────────────────────
let _nid = Date.now();
export const newId = () => `t${_nid++}`;

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

export const isOverdue  = (due) => (due ? due < todayStr() : false);
export const isDueToday = (due) => due === todayStr();

export function formatDate(d) {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${+day}`;
}

// ─── Default Data ─────────────────────────────────────────────────────────────
export const DEFAULT_TASKS = [];

export function makeDefaultLog() {
  const fmt = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return {
    "W1-D1": { date: fmt, standup: "", summary: "", notes: "" },
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────
export const loadTasks = () => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
};

export const loadLog = () => {
  try {
    const r = localStorage.getItem(LOG_KEY);
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
};

export const loadTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    return "dark";
  }
};

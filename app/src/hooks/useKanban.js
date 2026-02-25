import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { STORAGE_KEY, LOG_KEY, THEME_KEY } from "../constants";
import { THEME } from "../theme";
import { newId, isOverdue, isDueToday, loadTasks, loadLog, loadTheme, makeDefaultLog } from "../utils";
import { callGemini, exportWeekPDF } from "../api";

const MAX_UNDO = 30;

export default function useKanban() {
  const [tasks,          setTasks]          = useState(loadTasks);
  const [log,            setLog]            = useState(() => { const l = loadLog(); return Object.keys(l).length ? l : makeDefaultLog(); });
  const [theme,          setTheme]          = useState(loadTheme);
  const [activeTab,      setActiveTab]      = useState("board");
  const [dragId,         setDragId]         = useState(null);
  const [overCol,        setOverCol]        = useState(null);
  const [editing,        setEditing]        = useState(null);
  const [activeDay,      setActiveDay]      = useState("W1-D1");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [loadingDay,     setLoadingDay]     = useState(false);
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [loadingWeek,    setLoadingWeek]    = useState(false);
  const [weekSummaries,  setWeekSummaries]  = useState({});
  const [activeColIdx,   setActiveColIdx]   = useState(0);
  const [showReport,     setShowReport]     = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // {id, title}

  // ── New feature state ──
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filterType,     setFilterType]     = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showBackup,     setShowBackup]     = useState(false);
  const [showShortcuts,  setShowShortcuts]  = useState(false);

  // ── Undo / Redo ──
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // ── Toasts ──
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((p) => [...p, { id, message, type, duration }]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const boardRef = useRef(null);

  // ── Apply theme CSS vars ──
  useEffect(() => {
    Object.entries(THEME[theme]).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  // ── Persist to localStorage (debounced 500ms) ──
  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {} }, 500);
    return () => clearTimeout(id);
  }, [tasks]);
  useEffect(() => {
    const id = setTimeout(() => { try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch {} }, 500);
    return () => clearTimeout(id);
  }, [log]);

  // ── Track mobile board scroll position ──
  useEffect(() => {
    const board = boardRef.current; if (!board) return;
    const onScroll = () => {
      const idx = Math.round(board.scrollLeft / board.offsetWidth);
      setActiveColIdx(idx);
    };
    board.addEventListener("scroll", onScroll, { passive: true });
    return () => board.removeEventListener("scroll", onScroll);
  }, []);

  // ── Handlers (undo-aware) ──
  /** Push current tasks to undo stack before mutating, with a label for toast */
  const pushUndo = useCallback((label) => {
    setTasks((cur) => {
      undoStack.current.push({ tasks: cur, label });
      if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
      redoStack.current = []; // any new action clears redo
      return cur; // no state change — the caller sets tasks separately
    });
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const entry = undoStack.current.pop();
    setTasks((cur) => {
      redoStack.current.push({ tasks: cur, label: entry.label });
      return entry.tasks;
    });
    addToast(`↩ Undo: ${entry.label}`, "info", 3000);
  }, [addToast]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const entry = redoStack.current.pop();
    setTasks((cur) => {
      undoStack.current.push({ tasks: cur, label: entry.label });
      return entry.tasks;
    });
    addToast(`↪ Redo: ${entry.label}`, "info", 3000);
  }, [addToast]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const toggleTheme     = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const handleDragStart = useCallback((e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; }, []);
  const handleDragOver  = useCallback((e) => e.preventDefault(), []);
  const handleDrop      = useCallback((e, colId) => {
    e.preventDefault(); if (!dragId) return;
    pushUndo("move task");
    setTasks((p) => p.map((t) => (t.id === dragId ? { ...t, col: colId } : t)));
    setDragId(null); setOverCol(null);
  }, [dragId, pushUndo]);

  const handleDelete      = useCallback((id, title) => setConfirmDelete({ id, title }), []);
  const confirmDeleteTask = useCallback(() => {
    if (confirmDelete) {
      pushUndo(`delete "${confirmDelete.title}"`);
      setTasks((p) => p.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  }, [confirmDelete, pushUndo]);
  const handleMove = useCallback((id, colId) => {
    pushUndo("move task");
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, col: colId } : t)));
  }, [pushUndo]);
  const handleAdd       = useCallback((colId, data) => {
    pushUndo("add task");
    setTasks((p) => [...p, { id: newId(), col: colId, ...data, subtasks: data.subtasks || [] }]);
  }, [pushUndo]);
  const handleSaveEdit  = useCallback((u) => {
    pushUndo("edit task");
    setTasks((p) => p.map((t) => (t.id === u.id ? u : t)));
    setEditing(null);
  }, [pushUndo]);
  const updateLog       = (key, patch) => setLog((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  // ── Subtask toggle (from card) ──
  const toggleSubtask = useCallback((taskId, subtaskId) => {
    setTasks((p) => p.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: (t.subtasks || []).map((s) => s.id === subtaskId ? { ...s, done: !s.done } : s) };
    }));
  }, []);

  // ── Data export/import ──
  const handleRestore = useCallback((data) => {
    setTasks(data.tasks);
    setLog(data.log || {});
    if (data.theme) setTheme(data.theme);
  }, []);

  // ── Search & filter logic (memoized) ──
  const filteredTasks = useMemo(() => tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchBlocker = t.blocker?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchBlocker) return false;
    }
    if (filterType && t.type !== filterType) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  }), [tasks, searchQuery, filterType, filterPriority]);

  const addDay = () => {
    const wks = [...new Set(Object.keys(log).map((k) => k.split("-")[0]))];
    const lw = wks[wks.length - 1] || "W1";
    const din = Object.keys(log).filter((k) => k.startsWith(lw)).length;
    const nk = din < 5 ? `${lw}-D${din + 1}` : `W${+lw.replace("W", "") + 1}-D1`;
    const fmt = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    setLog((p) => ({ ...p, [nk]: { date: fmt, notes: "", summary: "", standup: "" } }));
    setActiveDay(nk); setSidebarOpen(false);
  };

  // ── AI Actions ──
  const summarizeDay = async () => {
    setLoadingDay(true);
    const entry = log[activeDay] || {}; const [week, day] = activeDay.split("-D");
    const doneList = tasks.filter((t) => t.col === "done").map((t) => `- ${t.title} (${t.type})`).join("\n") || "None";
    try {
      const summary = await callGemini(
        `Summarize the daily work log of a QA Engineering intern.\nWeek ${week.replace("W", "")}, Day ${day} — ${entry.date || ""}\nCOMPLETED:\n${doneList}\nNOTES:\n${entry.notes || "No notes."}\nWrite a concise 3–5 sentence professional summary in first person.`
      );
      updateLog(activeDay, { summary });
    } catch { updateLog(activeDay, { summary: "Error generating summary." }); }
    setLoadingDay(false);
  };

  const generateStandup = async () => {
    setLoadingStandup(true);
    const entry = log[activeDay] || {}; const [week, day] = activeDay.split("-D");
    const doneList = tasks.filter((t) => t.col === "done").map((t) => `- ${t.title}`).join("\n") || "None";
    const inProg   = tasks.filter((t) => t.col === "inprogress").map((t) => `- ${t.title}`).join("\n") || "None";
    const blockers = tasks.filter((t) => t.blocker).map((t) => `- ${t.title}: ${t.blocker}`).join("\n") || "None";
    try {
      const raw = await callGemini(
        `Generate standup for QA intern. Week ${week.replace("W", "")}, Day ${day}.\nDONE: ${doneList}\nIN PROGRESS: ${inProg}\nBLOCKERS: ${blockers}\nNOTES: ${entry.notes || "None"}\nRespond with EXACTLY three sections separated by "|||" (no labels, no extra text):\n[2-4 bullet points of what was done yesterday]|||[2-4 bullet points for today]|||[blockers or "No blockers today."]`
      );
      updateLog(activeDay, { standup: raw.trim() });
    } catch { updateLog(activeDay, { standup: "Error|||Error|||Error" }); }
    setLoadingStandup(false);
  };

  const summarizeWeek = async () => {
    setLoadingWeek(true);
    const [weekKey] = activeDay.split("-D");
    const weekDays = Object.entries(log).filter(([k]) => k.startsWith(weekKey));
    const doneList = tasks.filter((t) => t.col === "done").map((t) => `- ${t.title} (${t.type})`).join("\n") || "None";
    const dayBreakdowns = weekDays.map(([k, e]) =>
      `Day ${k.split("-D")[1]} (${e.date || ""}): ${e.notes || "No notes"}${e.summary ? `\n${e.summary}` : ""}`
    ).join("\n\n");
    try {
      const summary = await callGemini(
        `Weekly summary for QA intern. Week ${weekKey.replace("W", "")}.\nDAILY LOGS:\n${dayBreakdowns}\nCOMPLETED:\n${doneList}\nWrite structured summary with: 1. Overall Achievements 2. Key Learnings 3. Challenges & Blockers 4. Next Week Focus. Professional, first person.`
      );
      setWeekSummaries((p) => ({ ...p, [weekKey]: summary }));
    } catch { setWeekSummaries((p) => ({ ...p, [weekKey]: "Error generating summary." })); }
    setLoadingWeek(false);
  };

  const handleExportPDF = () => {
    const [weekKey] = activeDay.split("-D");
    exportWeekPDF({ weekKey, log, doneTasks: tasks.filter((t) => t.col === "done"), weekSummary: weekSummaries[weekKey] });
  };

  // ── Derived values (memoized) ──
  const weeks = useMemo(() => {
    const w = {};
    Object.keys(log).sort().forEach((k) => { const [wk] = k.split("-D"); if (!w[wk]) w[wk] = []; w[wk].push(k); });
    return w;
  }, [log]);

  const doneStat    = useMemo(() => tasks.filter((t) => t.col === "done").length, [tasks]);
  const overdueStat = useMemo(() => tasks.filter((t) => isOverdue(t.due) && t.col !== "done").length, [tasks]);
  const blockedStat = useMemo(() => tasks.filter((t) => t.blocker && t.col !== "done").length, [tasks]);
  const dateStr     = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), []);
  const [activeWeek] = activeDay.split("-D");

  // ── Due-date notifications on mount ──
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    const overdueList = tasks.filter((t) => isOverdue(t.due) && t.col !== "done");
    const dueTodayList = tasks.filter((t) => isDueToday(t.due) && t.col !== "done");
    if (overdueList.length > 0) {
      addToast(
        `${overdueList.length} task${overdueList.length > 1 ? "s" : ""} overdue!  ${overdueList.map((t) => t.title).join(", ")}`,
        "error", 8000,
      );
    }
    if (dueTodayList.length > 0) {
      addToast(
        `${dueTodayList.length} task${dueTodayList.length > 1 ? "s" : ""} due today:  ${dueTodayList.map((t) => t.title).join(", ")}`,
        "warning", 8000,
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    tasks, theme, activeTab, overCol, editing, activeDay,
    sidebarOpen, loadingDay, loadingStandup, loadingWeek,
    weekSummaries, activeColIdx, showReport, confirmDelete, log,
    boardRef,

    // New feature state
    searchQuery, filterType, filterPriority,
    showBackup, showShortcuts,
    filteredTasks,

    // Undo / Redo
    undo, redo, canUndo, canRedo,

    // Toasts
    toasts, addToast, dismissToast,

    // Setters
    setActiveTab, setOverCol, setEditing, setActiveDay,
    setSidebarOpen, setShowReport, setConfirmDelete,
    setSearchQuery, setFilterType, setFilterPriority,
    setShowBackup, setShowShortcuts,

    // Handlers
    toggleTheme, handleDragStart, handleDragOver, handleDrop,
    handleDelete, confirmDeleteTask, handleMove, handleAdd,
    handleSaveEdit, updateLog, addDay,
    summarizeDay, generateStandup, summarizeWeek, handleExportPDF,
    toggleSubtask, handleRestore,

    // Derived
    weeks, doneStat, overdueStat, blockedStat, dateStr, activeWeek,
  };
}

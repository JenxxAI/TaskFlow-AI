import { useEffect } from "react";
import "./styles.css";
import { COLUMNS } from "./constants";
import useKanban from "./hooks/useKanban";
import KanbanColumn from "./components/KanbanColumn";
import ColDots from "./components/ColDots";
import DayEntry from "./components/DayEntry";
import WeekAccordion from "./components/WeekAccordion";
import EditModal from "./components/EditModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import PracticumReportModal from "./components/PracticumReportModal";
import SearchFilterBar from "./components/SearchFilterBar";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import DataBackupModal from "./components/DataBackupModal";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal";

export default function App() {
  const {
    tasks, theme, activeTab, overCol, editing, activeDay,
    sidebarOpen, loadingDay, loadingStandup, loadingWeek,
    weekSummaries, activeColIdx, showReport, confirmDelete, log,
    boardRef,
    // new feature state
    searchQuery, filterType, filterPriority,
    showBackup, showShortcuts, filteredTasks,
    // setters
    setActiveTab, setOverCol, setEditing, setActiveDay,
    setSidebarOpen, setShowReport, setConfirmDelete,
    setSearchQuery, setFilterType, setFilterPriority,
    setShowBackup, setShowShortcuts,
    // handlers
    toggleTheme, handleDragStart, handleDragOver, handleDrop,
    handleDelete, confirmDeleteTask, handleMove, handleAdd,
    handleSaveEdit, updateLog, addDay,
    summarizeDay, generateStandup, summarizeWeek, handleExportPDF,
    toggleSubtask, handleRestore,
    // derived
    weeks, doneStat, overdueStat, blockedStat, dateStr, activeWeek,
  } = useKanban();

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) return;
      switch (e.key.toLowerCase()) {
        case "n": e.preventDefault(); setActiveTab("board"); break;
        case "/": e.preventDefault(); setActiveTab("board"); setTimeout(() => document.getElementById("task-search-input")?.focus(), 50); break;
        case "1": case "2": case "3": case "4": {
          const board = boardRef.current; if (!board) break;
          const idx = +e.key - 1;
          board.scrollTo({ left: board.offsetWidth * idx, behavior: "smooth" }); break;
        }
        case "b": e.preventDefault(); setActiveTab("board"); break;
        case "l": e.preventDefault(); setActiveTab("log"); break;
        case "a": e.preventDefault(); setActiveTab("analytics"); break;
        case "d": e.preventDefault(); toggleTheme(); break;
        case "?": e.preventDefault(); setShowShortcuts(true); break;
        case "escape": setEditing(null); setShowBackup(false); setShowShortcuts(false); setShowReport(false); setConfirmDelete(null); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveTab, boardRef, toggleTheme, setEditing, setShowBackup, setShowShortcuts, setShowReport, setConfirmDelete]);

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-title">My QE Board</div>
          <div className="header-date">{dateStr}</div>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <div className="stat"><span className="stat-num" style={{ color: "#22c55e" }}>{doneStat}</span><span className="stat-label">Done</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num" style={{ color: overdueStat > 0 ? "#ef4444" : "var(--text-muted)" }}>{overdueStat}</span><span className="stat-label">Overdue</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num" style={{ color: blockedStat > 0 ? "#f59e0b" : "var(--text-muted)" }}>{blockedStat}</span><span className="stat-label">Blocked</span></div>
          </div>
          <div className="header-btn-group">
            <button className="header-btn" onClick={() => setShowBackup(true)} title="Backup / Restore">💾</button>
            <button className="header-btn" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts (?)">⌨️</button>
            <button className="theme-toggle" onClick={toggleTheme}>
              <span className={`toggle-pill${theme === "light" ? " active" : ""}`}>☀️</span>
              <span className={`toggle-pill${theme === "dark" ? " active" : ""}`}>🌙</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab${activeTab === "board" ? " active" : ""}`} onClick={() => setActiveTab("board")}>📋 Board</button>
        <button className={`tab${activeTab === "log" ? " active" : ""}`} onClick={() => setActiveTab("log")}>📓 Log</button>
        <button className={`tab${activeTab === "analytics" ? " active" : ""}`} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
      </div>

      {/* ── Board Tab ── */}
      {activeTab === "board" && (
        <>
          <SearchFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filterType={filterType} onFilterType={setFilterType}
            filterPriority={filterPriority} onFilterPriority={setFilterPriority}
            resultCount={filteredTasks.length} totalCount={tasks.length}
          />
          <div className="board" ref={boardRef}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id} col={col} theme={theme}
                tasks={filteredTasks.filter((t) => t.col === col.id)}
                onDragStart={handleDragStart} onDrop={handleDrop}
                onDragOver={(e) => { handleDragOver(e); setOverCol(col.id); }}
                onDragLeave={() => setOverCol(null)}
                isOver={overCol === col.id}
                onDelete={handleDelete} onEdit={setEditing} onAdd={handleAdd}
                onMove={handleMove}
              />
            ))}
          </div>
          <ColDots count={COLUMNS.length} active={activeColIdx} />
        </>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && <AnalyticsDashboard tasks={tasks} theme={theme} />}

      {/* ── Daily Log Tab ── */}
      {activeTab === "log" && (
        <div className="log-page">
          <div className={`drawer-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

          <div className={`log-sidebar${sidebarOpen ? " open" : ""}`}>
            <div className="log-sidebar-title">Internship Log</div>
            <div className="log-sidebar-list">
              {Object.entries(weeks).map(([week, days]) => (
                <WeekAccordion
                  key={week} week={week} days={days} log={log}
                  activeDay={activeDay} defaultOpen={week === activeWeek}
                  onSelectDay={(dk) => { setActiveDay(dk); setSidebarOpen(false); }}
                />
              ))}
            </div>
            <button className="add-day-btn" onClick={addDay}>+ add day</button>
          </div>

          {log[activeDay] ? (
            <DayEntry
              dayKey={activeDay} entry={log[activeDay]}
              doneTasks={tasks.filter((t) => t.col === "done")}
              onNotesChange={(v) => updateLog(activeDay, { notes: v })}
              onDaySummary={summarizeDay} onStandup={generateStandup}
              onWeekSummary={summarizeWeek}
              isLoadingDay={loadingDay} isLoadingStandup={loadingStandup} isLoadingWeek={loadingWeek}
              weekSummary={weekSummaries[activeWeek]}
              onExportPDF={handleExportPDF}
              onOpenSidebar={() => setSidebarOpen(true)}
              onOpenReport={() => setShowReport(true)}
            />
          ) : (
            <div className="log-main">
              <div className="log-main-header">
                <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
              </div>
              <div className="empty-log">
                <span className="empty-log-icon">📓</span>
                <span>Select a day to view your log</span>
                <span className="empty-log-hint">Tap ☰ to open the day list</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {editing && <EditModal task={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />}
      {confirmDelete && <ConfirmDeleteModal taskTitle={confirmDelete.title} onConfirm={confirmDeleteTask} onCancel={() => setConfirmDelete(null)} />}
      {showReport && (
        <PracticumReportModal
          weekKey={activeWeek} log={log}
          doneTasks={tasks.filter((t) => t.col === "done")}
          allTasks={tasks}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBackup && (
        <DataBackupModal
          tasks={tasks} log={log} theme={theme}
          onRestore={handleRestore} onClose={() => setShowBackup(false)}
        />
      )}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

import { COLUMNS, TASK_TYPES, TYPE_COLORS, PRIORITY_META } from "../constants";

export default function AnalyticsDashboard({ tasks, theme }) {
  // ── By status ──
  const byStatus = COLUMNS.map((col) => ({
    label: col.label,
    color: col.color,
    count: tasks.filter((t) => t.col === col.id).length,
  }));
  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1);

  // ── By type ──
  const byType = TASK_TYPES.map((type) => ({
    label: type,
    color: TYPE_COLORS[theme][type]?.text || "#6366f1",
    bg: TYPE_COLORS[theme][type]?.bg || "#1e1e30",
    count: tasks.filter((t) => t.type === type).length,
  }));
  const maxType = Math.max(...byType.map((s) => s.count), 1);

  // ── By priority ──
  const byPriority = ["high", "medium", "low"].map((p) => ({
    label: PRIORITY_META[p].label,
    color: PRIORITY_META[p].color,
    count: tasks.filter((t) => t.priority === p).length,
  }));
  const maxPri = Math.max(...byPriority.map((s) => s.count), 1);

  // ── Completion rate ──
  const total = tasks.length;
  const done = tasks.filter((t) => t.col === "done").length;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Overdue & blocked ──
  const today = new Date().toISOString().split("T")[0];
  const overdue = tasks.filter((t) => t.due && t.due < today && t.col !== "done").length;
  const blocked = tasks.filter((t) => t.blocker && t.col !== "done").length;

  // ── Subtask stats ──
  const allSubtasks = tasks.flatMap((t) => t.subtasks || []);
  const subtasksDone = allSubtasks.filter((s) => s.done).length;
  const subtasksTotal = allSubtasks.length;

  // ── Tasks by due date (next 7 days) ──
  const upcomingDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const count = tasks.filter((t) => t.due === dateStr && t.col !== "done").length;
    upcomingDays.push({ label: dayLabel, date: dateStr, count });
  }
  const maxUpcoming = Math.max(...upcomingDays.map((d) => d.count), 1);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-title">📊 Task Analytics</div>
        <div className="analytics-sub">Overview of your task board</div>
      </div>

      <div className="analytics-body">
        {/* ── Summary Cards ── */}
        <div className="analytics-summary">
          <div className="summary-card">
            <div className="summary-card-num" style={{ color: "#6366f1" }}>{total}</div>
            <div className="summary-card-label">Total Tasks</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-num" style={{ color: "#22c55e" }}>{completionPct}%</div>
            <div className="summary-card-label">Completion</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-num" style={{ color: overdue > 0 ? "#ef4444" : "var(--text-muted)" }}>{overdue}</div>
            <div className="summary-card-label">Overdue</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-num" style={{ color: blocked > 0 ? "#f59e0b" : "var(--text-muted)" }}>{blocked}</div>
            <div className="summary-card-label">Blocked</div>
          </div>
          {subtasksTotal > 0 && (
            <div className="summary-card">
              <div className="summary-card-num" style={{ color: "#818cf8" }}>{subtasksDone}/{subtasksTotal}</div>
              <div className="summary-card-label">Subtasks</div>
            </div>
          )}
        </div>

        {/* ── Completion Ring ── */}
        <div className="analytics-section">
          <div className="analytics-section-title">Completion Progress</div>
          <div className="completion-ring-wrap">
            <svg className="completion-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-card)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="#22c55e" strokeWidth="8"
                strokeDasharray={`${completionPct * 3.267} ${326.7 - completionPct * 3.267}`}
                strokeDashoffset="81.675"
                strokeLinecap="round"
              />
            </svg>
            <div className="completion-ring-text">
              <span className="completion-ring-pct">{completionPct}%</span>
              <span className="completion-ring-label">{done}/{total}</span>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          {/* ── By Status ── */}
          <div className="analytics-section">
            <div className="analytics-section-title">By Status</div>
            <div className="analytics-bars">
              {byStatus.map((s) => (
                <div className="analytics-bar-row" key={s.label}>
                  <span className="bar-label">{s.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(s.count / maxStatus) * 100}%`, background: s.color }} />
                  </div>
                  <span className="bar-value">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── By Type ── */}
          <div className="analytics-section">
            <div className="analytics-section-title">By Type</div>
            <div className="analytics-bars">
              {byType.map((s) => (
                <div className="analytics-bar-row" key={s.label}>
                  <span className="bar-label">{s.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(s.count / maxType) * 100}%`, background: s.color }} />
                  </div>
                  <span className="bar-value">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── By Priority ── */}
          <div className="analytics-section">
            <div className="analytics-section-title">By Priority</div>
            <div className="analytics-bars">
              {byPriority.map((s) => (
                <div className="analytics-bar-row" key={s.label}>
                  <span className="bar-label">{s.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(s.count / maxPri) * 100}%`, background: s.color }} />
                  </div>
                  <span className="bar-value">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upcoming Due Dates ── */}
          <div className="analytics-section">
            <div className="analytics-section-title">Due This Week</div>
            <div className="analytics-bars">
              {upcomingDays.map((d) => (
                <div className="analytics-bar-row" key={d.date}>
                  <span className="bar-label">{d.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(d.count / maxUpcoming) * 100}%`, background: d.label === "Today" ? "#f59e0b" : "#6366f1" }} />
                  </div>
                  <span className="bar-value">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

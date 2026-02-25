import CopyButton from "./CopyButton";

export default function DayEntry({
  dayKey, entry, doneTasks, onNotesChange,
  onDaySummary, onStandup, onWeekSummary,
  isLoadingDay, isLoadingStandup, isLoadingWeek,
  weekSummary, onExportPDF, onOpenSidebar, onOpenReport,
}) {
  const [week, day] = dayKey.split("-D");
  const summaryCopyText = entry.summary || "";
  const standupParts = entry.standup ? entry.standup.split("|||") : null;
  const standupCopyText = standupParts
    ? `STANDUP — ${entry.date || dayKey}\n\n✅ What I Did:\n${standupParts[0] || ""}\n\n🔄 Doing Today:\n${standupParts[1] || ""}\n\n🚧 Blockers:\n${standupParts[2] || ""}`
    : "";

  return (
    <div className="log-main">
      <div className="log-main-header">
        <div className="log-header-left">
          <button className="menu-btn" onClick={onOpenSidebar}>☰</button>
          <div>
            <div className="log-day-title">Week {week.replace("W", "")} · Day {day}</div>
            <div className="log-day-sub">{entry.date || "No date set"}</div>
          </div>
        </div>
        <div className="log-actions">
          <button className="ai-btn standup-btn" onClick={onStandup} disabled={isLoadingStandup}>
            {isLoadingStandup
              ? <><span className="ai-spinner" style={{ borderTopColor: "var(--standup-text)" }} />...</>
              : <><span className="ai-icon">☀</span><span className="ai-label">☀ Standup</span></>}
          </button>
          <button className="ai-btn week-btn" onClick={onWeekSummary} disabled={isLoadingWeek}>
            {isLoadingWeek
              ? <><span className="ai-spinner" style={{ borderTopColor: "#6366f1" }} />...</>
              : <><span className="ai-icon">✦W</span><span className="ai-label">✦ Week</span></>}
          </button>
          <button className="ai-btn day-btn" onClick={onDaySummary} disabled={isLoadingDay}>
            {isLoadingDay
              ? <><span className="ai-spinner" />...</>
              : <><span className="ai-icon">✦D</span><span className="ai-label">✦ Day</span></>}
          </button>
          <button className="ai-btn report-sm" onClick={onOpenReport} title="Generate Practicum Report">
            <span className="ai-icon">📋</span><span className="ai-label">📋 Report</span>
          </button>
          <button className="ai-btn pdf-btn" onClick={onExportPDF} title="Export week as PDF">
            <span className="ai-icon">⬇</span><span className="ai-label">⬇ PDF</span>
          </button>
        </div>
      </div>

      <div className="log-body">
        {/* Done cards */}
        <div>
          <div className="log-section-title">✓ Completed tasks (from board)</div>
          {doneTasks.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
              Move cards to Done on the board to see them here
            </div>
          ) : (
            <div className="done-cards-list">
              {doneTasks.map((t) => (
                <div className="done-card-chip" key={t.id}>
                  <span className="done-card-check">✓</span>
                  <div>
                    <div>{t.title}</div>
                    <div className="done-card-type">{t.type} · {t.priority} priority</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="log-section-title">📝 Notes & observations</div>
          <textarea
            className="notes-area"
            placeholder={"What else did you do today?\n\n• Attended sprint planning\n• Reviewed PR #42\n• 1:1 with mentor..."}
            value={entry.notes || ""}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        {/* Standup */}
        {standupParts && (
          <div className="standup-box">
            <div className="standup-header">
              <div className="standup-label">☀ Daily Standup</div>
              <CopyButton text={standupCopyText} label="Copy Standup" />
            </div>
            <div className="standup-section">
              <div className="standup-section-title">✅ What I Did Yesterday</div>
              <div className="standup-section-body">{standupParts[0]}</div>
            </div>
            <div className="standup-section">
              <div className="standup-section-title">🔄 Doing Today</div>
              <div className="standup-section-body">{standupParts[1]}</div>
            </div>
            <div className="standup-section">
              <div className="standup-section-title">🚧 Blockers</div>
              <div className="standup-section-body">{standupParts[2]}</div>
            </div>
          </div>
        )}

        {/* Day summary */}
        {entry.summary && (
          <div className="summary-box">
            <div className="summary-header">
              <div className="summary-label">✦ AI Day Summary</div>
              <CopyButton text={summaryCopyText} />
            </div>
            <div className="summary-text">{entry.summary}</div>
          </div>
        )}

        {/* Week summary */}
        {weekSummary && (
          <div className="week-summary-box">
            <div className="week-summary-header">
              <div className="week-summary-title">✦ Week {week.replace("W", "")} Summary</div>
              <CopyButton text={weekSummary} />
            </div>
            <div className="summary-text">{weekSummary}</div>
          </div>
        )}
      </div>
    </div>
  );
}

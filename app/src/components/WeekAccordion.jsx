import { useState, useEffect } from "react";

export default function WeekAccordion({ week, days, log, activeDay, defaultOpen, onSelectDay }) {
  const [open, setOpen] = useState(defaultOpen);
  const weekNum = week.replace("W", "");

  // Auto-open if the active day is inside this week
  useEffect(() => {
    if (days.includes(activeDay)) setOpen(true);
  }, [activeDay, days]);

  const hasActive = days.includes(activeDay);

  // Count how many days have content
  const filledDays = days.filter((dk) => {
    const e = log[dk] || {};
    return e.notes || e.summary || e.standup;
  });

  return (
    <div className="week-accordion">
      {/* Week header — click to toggle */}
      <button className="week-accordion-header" onClick={() => setOpen((o) => !o)}>
        <span className={`week-chevron${open ? " open" : ""}`}>▶</span>
        <span className={`week-accordion-label${hasActive ? " has-active" : ""}`}>
          Week {weekNum}
        </span>
        {/* Status pips: one dot per day */}
        <span className="week-pips">
          {days.map((dk) => {
            const e = log[dk] || {};
            const filled = e.notes || e.summary || e.standup;
            const isActive = dk === activeDay;
            return (
              <span
                key={dk}
                className={`week-pip${isActive ? " active-day" : filled ? " filled" : ""}`}
                title={`Day ${dk.split("-D")[1]}`}
              />
            );
          })}
        </span>
      </button>

      {/* Days — collapsible */}
      <div className={`week-days${open ? " open" : ""}`}>
        {days.map((dk) => {
          const d = dk.split("-D")[1];
          const e = log[dk] || {};
          const hasContent = e.notes || e.summary || e.standup;
          return (
            <button
              key={dk}
              className={`day-item${activeDay === dk ? " active" : ""}`}
              onClick={() => onSelectDay(dk)}
            >
              <span>Day {d}</span>
              <span className="day-item-right">
                {e.date && <span className="day-item-date">{e.date}</span>}
                {hasContent && <span className="day-item-dot" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

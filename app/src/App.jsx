import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: "todo",       label: "To Do",       color: "#64748b" },
  { id: "inprogress", label: "In Progress", color: "#f59e0b" },
  { id: "blocked",    label: "Blocked",     color: "#ef4444" },
  { id: "done",       label: "Done",        color: "#22c55e" },
];
const TASK_TYPES = ["Daily To-Do", "Test Case", "Bug Report", "Learning"];
const TYPE_COLORS = {
  dark: {
    "Daily To-Do": { bg:"#1e3a5f", text:"#60a5fa", border:"#1d4ed8" },
    "Test Case":   { bg:"#1a3a2a", text:"#4ade80", border:"#15803d" },
    "Bug Report":  { bg:"#3b1a1a", text:"#f87171", border:"#b91c1c" },
    "Learning":    { bg:"#2e1a3b", text:"#c084fc", border:"#7c3aed" },
  },
  light: {
    "Daily To-Do": { bg:"#dbeafe", text:"#1d4ed8", border:"#93c5fd" },
    "Test Case":   { bg:"#dcfce7", text:"#15803d", border:"#86efac" },
    "Bug Report":  { bg:"#fee2e2", text:"#b91c1c", border:"#fca5a5" },
    "Learning":    { bg:"#f3e8ff", text:"#7c3aed", border:"#d8b4fe" },
  },
};
const PRIORITY_META = {
  high:   { color:"#ef4444", label:"High" },
  medium: { color:"#f59e0b", label:"Med"  },
  low:    { color:"#22c55e", label:"Low"  },
};

const STORAGE_KEY = "qe_kanban_tasks_v2";
const LOG_KEY     = "qe_kanban_log_v2";
const THEME_KEY   = "qe_kanban_theme";

let _nid = Date.now();
const newId = () => `t${_nid++}`;

function todayStr(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
const isOverdue  = due => due ? due < todayStr() : false;
const isDueToday = due => due === todayStr();
function formatDate(d) {
  if (!d) return "";
  const [,m,day] = d.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+day}`;
}

const DEFAULT_TASKS = [
  // ── Day 1 (Monday) ──
  { id:newId(), col:"done", title:"Attend QA Daily StatusHero Catch-up",         type:"Daily To-Do", priority:"high",   due:todayStr(-4), notes:"Team shared blockers and sprint priorities. Discussed RPI regression scope.", blocker:"" },
  { id:newId(), col:"done", title:"RPI Regression Testing – Route A & B",        type:"Test Case",   priority:"high",   due:todayStr(-4), notes:"Verified routing scenarios after latest deploy. All 12 cases passed.",      blocker:"" },
  // ── Day 2 (Tuesday) ──
  { id:newId(), col:"done", title:"Cluster Exclusive Simulation",                type:"Test Case",   priority:"high",   due:todayStr(-3), notes:"Tested exclusive cluster config. Found 1 edge case with null route fallback.", blocker:"" },
  { id:newId(), col:"done", title:"Company Townhall Meeting",                    type:"Daily To-Do", priority:"medium", due:todayStr(-3), notes:"Org updates, OKRs for Q2, and department announcements.",                    blocker:"" },
  { id:newId(), col:"done", title:"Continue RPI Regression – pending cases",     type:"Test Case",   priority:"high",   due:todayStr(-3), notes:"Completed remaining 8 test cases. Logged 2 defects in Jira.",               blocker:"" },
  // ── Day 3 (Wednesday) ──
  { id:newId(), col:"done", title:"End-to-End Testing: Store App Order Flow",    type:"Test Case",   priority:"high",   due:todayStr(-2), notes:"Tested full order cycle: create → confirm → fulfill. Found issue on cancel step.", blocker:"" },
  { id:newId(), col:"done", title:"Replicate Shipper App v5.2.0 Bugs",           type:"Bug Report",  priority:"high",   due:todayStr(-2), notes:"Reproduced 3 reported bugs. Documented steps and screenshots in Jira.",       blocker:"" },
  // ── Day 4 (Thursday) ──
  { id:newId(), col:"done", title:"KT Session: Returns & Shipper Clearance",     type:"Learning",    priority:"medium", due:todayStr(-1), notes:"In-depth walkthrough by Miss Danes. Covered full returns lifecycle and clearance workflow.", blocker:"" },
  { id:newId(), col:"done", title:"Explore Returns Module Independently",        type:"Learning",    priority:"medium", due:todayStr(-1), notes:"Mapped out edge cases: partial returns, rejected clearance, duplicate shipper IDs.", blocker:"" },
  { id:newId(), col:"done", title:"Test Order Fulfillment Scenarios (no distance)", type:"Test Case", priority:"high",  due:todayStr(-1), notes:"Tested: partial delivery, successful delivery, redelivery, cancelled orders.",  blocker:"" },
  // ── Day 5 (Friday) ──
  { id:newId(), col:"done", title:"Delivery Distance Testing (>250m)",           type:"Test Case",   priority:"high",   due:todayStr(0),  notes:"Stores: Big Boy, Danesari, Soaferstore. All 3 returned correct distance-fail status.", blocker:"" },
  { id:newId(), col:"done", title:"Delivery Distance Testing (≤250m)",           type:"Test Case",   priority:"high",   due:todayStr(0),  notes:"Validated Pinoy Big Bottle. Distance-pass scenario working as expected.",      blocker:"" },
  { id:newId(), col:"done", title:"Document all test results in Jira",           type:"Daily To-Do", priority:"medium", due:todayStr(0),  notes:"Logged 7 test runs, 3 defects, 1 observation. Linked to sprint board.",        blocker:"" },
  // ── Active tasks still in progress ──
  { id:newId(), col:"inprogress", title:"Write test cases for Checkout v2 flow", type:"Test Case",   priority:"medium", due:todayStr(2),  notes:"Focus on payment gateway edge cases", blocker:"" },
  { id:newId(), col:"todo",       title:"Read: Cypress Best Practices docs",     type:"Learning",    priority:"low",    due:todayStr(4),  notes:"Focus on custom commands and fixtures chapter", blocker:"" },
  { id:newId(), col:"blocked",    title:"Automate RPI regression suite",         type:"Test Case",   priority:"high",   due:todayStr(3),  notes:"Cypress scripts drafted", blocker:"Waiting for test environment credentials from DevOps" },
];

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  dark: {
    "--bg":"#080810","--bg-header":"#0c0c18","--bg-col":"#0f0f1a","--bg-card":"#13131f",
    "--bg-form":"#080810","--bg-modal":"#0c0c18","--bg-btn":"#12121e","--bg-count":"#1a1a2e",
    "--bg-blocker":"#1f0f0f","--border":"#1a1a2e","--border-card":"#1e1e30","--border-card-h":"#2e2e4e",
    "--border-form":"#1a1a2e","--border-blocker":"#3b1a1a","--text":"#cbd5e1","--text-title":"#f1f5f9",
    "--text-card":"#e2e8f0","--text-muted":"#3d4f6b","--text-col":"#64748b","--text-btn":"#475569",
    "--text-btn-h":"#94a3b8","--text-count":"#475569","--text-notes":"#475569","--text-blocker":"#f87171",
    "--scrollbar":"#1e1e2e","--drag-over-bg":"#0d0d20","--shadow":"rgba(0,0,0,0.6)",
    "--log-entry-bg":"#0f0f1a","--log-entry-border":"#1a1a2e",
    "--summary-bg":"#0a140a","--summary-border":"#1a3a1a","--summary-text":"#4ade80",
    "--standup-bg":"#0a0a1f","--standup-border":"#1a1a3a","--standup-text":"#818cf8",
    "--drawer-overlay":"rgba(0,0,0,0.7)",
  },
  light: {
    "--bg":"#f1f5f9","--bg-header":"#ffffff","--bg-col":"#f8fafc","--bg-card":"#ffffff",
    "--bg-form":"#f8fafc","--bg-modal":"#ffffff","--bg-btn":"#f1f5f9","--bg-count":"#e2e8f0",
    "--bg-blocker":"#fff5f5","--border":"#e2e8f0","--border-card":"#e8edf3","--border-card-h":"#c7d2e0",
    "--border-form":"#e2e8f0","--border-blocker":"#fecaca","--text":"#334155","--text-title":"#0f172a",
    "--text-card":"#1e293b","--text-muted":"#94a3b8","--text-col":"#64748b","--text-btn":"#64748b",
    "--text-btn-h":"#334155","--text-count":"#64748b","--text-notes":"#64748b","--text-blocker":"#dc2626",
    "--scrollbar":"#cbd5e1","--drag-over-bg":"#eef2ff","--shadow":"rgba(0,0,0,0.08)",
    "--log-entry-bg":"#ffffff","--log-entry-border":"#e2e8f0",
    "--summary-bg":"#f0fdf4","--summary-border":"#bbf7d0","--summary-text":"#15803d",
    "--standup-bg":"#eef2ff","--standup-border":"#c7d2fe","--standup-text":"#4338ca",
    "--drawer-overlay":"rgba(0,0,0,0.4)",
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%}
  body,#root{min-height:100vh;background:var(--bg);font-family:'IBM Plex Mono',monospace;color:var(--text);transition:background .25s,color .25s}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--scrollbar);border-radius:2px}

  .app{display:flex;flex-direction:column;height:100dvh;overflow:hidden}

  /* ── HEADER ── */
  .header{
    padding:12px 20px;border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    flex-shrink:0;background:var(--bg-header);
    transition:background .25s,border-color .25s;
    gap:12px;
  }
  .header-left{display:flex;flex-direction:column;gap:1px;min-width:0}
  .header-title{font-family:'Sora',sans-serif;font-size:17px;font-weight:600;color:var(--text-title);letter-spacing:-.3px;white-space:nowrap}
  .header-date{font-size:9px;color:var(--text-muted);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
  .header-right{display:flex;align-items:center;gap:12px;flex-shrink:0}
  .header-stats{display:flex;gap:12px;align-items:center}
  .stat{display:flex;flex-direction:column;align-items:center;gap:1px}
  .stat-num{font-family:'Sora',sans-serif;font-size:16px;font-weight:600;line-height:1}
  .stat-label{font-size:8px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em}
  .stat-div{width:1px;height:22px;background:var(--border)}

  /* Theme toggle */
  .theme-toggle{background:var(--bg-btn);border:1px solid var(--border-card);border-radius:20px;padding:3px 4px;cursor:pointer;display:flex;align-items:center;gap:2px;transition:background .2s;flex-shrink:0}
  .toggle-pill{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;transition:background .2s;line-height:1}
  .toggle-pill.active{background:var(--border-card-h)}

  /* ── TABS ── */
  .tabs{display:flex;border-bottom:1px solid var(--border);background:var(--bg-header);flex-shrink:0;padding:0 20px;overflow-x:auto}
  .tabs::-webkit-scrollbar{display:none}
  .tab{padding:9px 16px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border:none;background:transparent;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap;flex-shrink:0}
  .tab.active{color:#6366f1;border-bottom-color:#6366f1}

  /* ── BOARD — DESKTOP ── */
  .board{
    display:flex;gap:14px;
    padding:16px 20px 20px;
    overflow-x:auto;overflow-y:hidden;
    flex:1;
    background:var(--bg);
    transition:background .25s;
    align-items:flex-start;
  }

  /* Column — desktop: fixed width, scrolls internally */
  .column{
    display:flex;flex-direction:column;
    width:280px;min-width:260px;
    flex-shrink:0;
    background:var(--bg-col);
    border-radius:12px;
    border:1px solid var(--border);
    /* KEY: column has a max height so cards scroll inside it */
    max-height:calc(100dvh - 140px);
    transition:border-color .2s,background .25s;
    overflow:hidden;
  }
  .column.drag-over{border-color:#6366f1;background:var(--drag-over-bg)}
  .col-header{padding:12px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--bg-col);position:sticky;top:0;z-index:1}
  .col-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .col-title{font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--text-col);flex:1}
  .col-count{font-size:10px;color:var(--text-count);background:var(--bg-count);border-radius:999px;padding:1px 8px}

  /* col-body scrolls vertically when many cards */
  .col-body{
    padding:10px;
    display:flex;flex-direction:column;gap:7px;
    overflow-y:auto;
    flex:1;
    /* custom thin scrollbar inside column */
    scrollbar-width:thin;
    scrollbar-color:var(--scrollbar) transparent;
  }

  /* ── CARD ── */
  .card{
    background:var(--bg-card);border:1px solid var(--border-card);
    border-radius:10px;padding:12px 13px;
    cursor:grab;
    transition:transform .12s,box-shadow .12s,border-color .15s;
    position:relative;user-select:none;
    /* prevent card from growing too tall — truncate notes */
  }
  .card:active{cursor:grabbing}
  .card:hover{border-color:var(--border-card-h);transform:translateY(-1px);box-shadow:0 4px 20px var(--shadow)}
  .card.overdue{border-left:3px solid #ef4444}
  .card.due-today{border-left:3px solid #f59e0b}

  .card-actions{position:absolute;top:8px;right:8px;display:none;gap:4px}
  .card:hover .card-actions{display:flex}
  /* always show on touch */
  @media (hover:none){.card-actions{display:flex}}

  .card-btn{background:var(--bg-btn);border:1px solid var(--border-card);border-radius:4px;color:var(--text-btn);font-size:12px;cursor:pointer;padding:3px 6px;line-height:1.3;font-family:'IBM Plex Mono',monospace;transition:color .15s;min-width:28px;min-height:28px;display:flex;align-items:center;justify-content:center}
  .card-btn:hover{color:var(--text-btn-h);border-color:var(--border-card-h)}
  .card-btn.del:hover{color:#ef4444}

  .card-type-row{display:flex;align-items:center;gap:6px;margin-bottom:7px}
  .type-badge{font-size:8px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:999px;font-weight:500;border:1px solid;white-space:nowrap}
  .priority-pip{width:5px;height:5px;border-radius:50%;flex-shrink:0}
  .card-title{font-size:12px;line-height:1.5;color:var(--text-card);margin-bottom:8px;padding-right:52px;word-break:break-word}
  .card-notes{
    font-size:10px;color:var(--text-notes);line-height:1.5;margin-bottom:8px;
    font-style:italic;border-left:2px solid var(--border-card);padding-left:7px;
    /* limit to 2 lines on desktop with many cards */
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  }
  .card-notes.expanded{display:block;-webkit-line-clamp:unset}
  .card-blocker{font-size:10px;color:var(--text-blocker);background:var(--bg-blocker);border:1px solid var(--border-blocker);border-radius:4px;padding:5px 8px;margin-bottom:8px;display:flex;gap:5px;align-items:flex-start}
  .card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .card-due{font-size:9px;padding:2px 7px;border-radius:4px;letter-spacing:.04em;white-space:nowrap}
  .card-due.overdue{background:#fee2e2;color:#b91c1c}
  .card-due.today{background:#fef3c7;color:#d97706}
  .card-due.normal{color:var(--text-muted)}

  /* ── MOBILE BOARD: horizontal swipe, full-width columns ── */
  @media (max-width:640px){
    .board{
      gap:0;padding:0;
      scroll-snap-type:x mandatory;
      -webkit-overflow-scrolling:touch;
    }
    .column{
      width:100vw;min-width:100vw;max-width:100vw;
      border-radius:0;border-left:none;border-right:none;
      max-height:calc(100dvh - 148px);
      scroll-snap-align:start;
      flex-shrink:0;
    }
    .col-header{border-radius:0;padding:14px 16px}
    .col-body{padding:12px}
    .card{border-radius:10px}
    .card-title{font-size:13px;padding-right:56px}
    .card-notes{-webkit-line-clamp:3}
  }

  /* Column scroll indicator dots on mobile */
  .col-dots{
    display:none;
    justify-content:center;gap:6px;padding:8px 0 4px;
    flex-shrink:0;background:var(--bg);
  }
  @media (max-width:640px){.col-dots{display:flex}}
  .col-dot-ind{width:6px;height:6px;border-radius:50%;background:var(--border-card);transition:background .2s}
  .col-dot-ind.active{background:#6366f1}

  /* ── FORMS ── */
  .add-btn{width:100%;background:transparent;border:1px dashed var(--border-card);border-radius:8px;padding:9px;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;transition:border-color .15s,color .15s;letter-spacing:.05em;margin-top:2px;flex-shrink:0;min-height:40px}
  .add-btn:hover{border-color:#6366f1;color:#6366f1}
  .add-form{background:var(--bg-card);border:1px solid #6366f1;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;margin-top:2px;flex-shrink:0}
  .form-row{display:flex;gap:6px}
  .form-row>*{flex:1;min-width:0}
  .form-input,.form-select,.form-textarea{background:var(--bg-form);border:1px solid var(--border-form);border-radius:6px;padding:7px 10px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-card);width:100%;outline:none;transition:border-color .15s;-webkit-appearance:none}
  .form-input:focus,.form-select:focus,.form-textarea:focus{border-color:#6366f1}
  .form-textarea{resize:vertical;min-height:60px}
  .form-label{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
  .form-actions{display:flex;gap:6px}
  .btn-save{flex:1;padding:8px;border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;cursor:pointer;border:none;letter-spacing:.08em;text-transform:uppercase;background:#4f46e5;color:white;transition:background .15s;min-height:38px}
  .btn-save:hover{background:#6366f1}
  .btn-cancel{flex:1;padding:8px;border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;cursor:pointer;border:none;letter-spacing:.08em;text-transform:uppercase;background:var(--bg-btn);color:var(--text-btn);min-height:38px}

  /* ── MODAL ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:flex-end;justify-content:center;z-index:200;backdrop-filter:blur(4px)}
  @media (min-width:641px){.modal-overlay{align-items:center}}
  .modal{
    background:var(--bg-modal);border:1px solid var(--border-card);
    border-radius:16px 16px 0 0;
    padding:20px;width:100%;max-width:100%;
    display:flex;flex-direction:column;gap:12px;
    max-height:92dvh;overflow-y:auto;
    transition:background .25s;
  }
  @media (min-width:641px){
    .modal{border-radius:14px;width:440px;max-height:90dvh}
  }
  .modal-drag-handle{width:36px;height:4px;background:var(--border-card);border-radius:2px;margin:0 auto 4px;display:block}
  @media (min-width:641px){.modal-drag-handle{display:none}}
  .modal-title{font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-title)}
  .modal .form-label{display:block;margin-bottom:4px}
  .modal .form-input,.modal .form-select,.modal .form-textarea{font-size:14px;padding:10px 12px}
  .modal .form-textarea{min-height:72px}
  select option{background:var(--bg-modal);color:var(--text-card)}

  /* ── DAILY LOG ── */
  .log-page{display:flex;flex:1;overflow:hidden;background:var(--bg);position:relative}

  /* Sidebar — desktop */
  .log-sidebar{
    width:210px;flex-shrink:0;border-right:1px solid var(--border);
    display:flex;flex-direction:column;overflow:hidden;
    background:var(--bg-header);transition:background .25s;
  }
  .log-sidebar-title{padding:12px 16px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border)}
  .log-sidebar-list{overflow-y:auto;flex:1;padding:6px 0}
  .log-sidebar-list::-webkit-scrollbar{width:3px}

  /* ── Week accordion ── */
  .week-accordion{display:flex;flex-direction:column;margin-bottom:2px}

  .week-accordion-header{
    display:flex;align-items:center;gap:8px;
    padding:9px 14px;cursor:pointer;
    background:transparent;border:none;width:100%;text-align:left;
    font-family:'IBM Plex Mono',monospace;
    transition:background .15s;
    position:relative;
  }
  .week-accordion-header:hover{background:var(--bg-col)}

  .week-chevron{
    font-size:10px;color:var(--text-muted);
    transition:transform .22s cubic-bezier(.4,0,.2,1);
    flex-shrink:0;line-height:1;
  }
  .week-chevron.open{transform:rotate(90deg)}

  .week-accordion-label{
    font-size:10px;font-weight:500;letter-spacing:.1em;
    text-transform:uppercase;color:var(--text-col);flex:1;
  }
  .week-accordion-label.has-active{color:#6366f1}

  /* small row of status pips — one per day, green if has content */
  .week-pips{display:flex;gap:3px;align-items:center;flex-shrink:0}
  .week-pip{width:5px;height:5px;border-radius:50%;background:var(--border-card)}
  .week-pip.filled{background:#22c55e}
  .week-pip.active-day{background:#6366f1}

  /* Collapsible day list */
  .week-days{
    display:flex;flex-direction:column;
    overflow:hidden;
    max-height:0;
    transition:max-height .25s cubic-bezier(.4,0,.2,1);
  }
  .week-days.open{max-height:400px}

  .day-item{
    padding:8px 14px 8px 30px;
    font-size:11px;cursor:pointer;
    color:var(--text-btn);
    transition:background .1s,color .1s;
    display:flex;justify-content:space-between;align-items:center;
    border-left:2px solid transparent;min-height:38px;
    background:transparent;border-top:none;border-right:none;border-bottom:none;
    width:100%;text-align:left;font-family:'IBM Plex Mono',monospace;
  }
  .day-item:hover{background:var(--bg-col);color:var(--text-card)}
  .day-item.active{background:var(--bg-col);color:#6366f1;border-left-color:#6366f1}

  .day-item-right{display:flex;align-items:center;gap:5px}
  .day-item-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0}
  .day-item-date{font-size:8px;color:var(--text-muted);opacity:.7}

  .add-day-btn{margin:8px 12px 10px;padding:9px;background:transparent;border:1px dashed var(--border-card);border-radius:8px;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:10px;cursor:pointer;transition:border-color .15s,color .15s;letter-spacing:.05em;min-height:38px;width:calc(100% - 24px)}
  .add-day-btn:hover{border-color:#6366f1;color:#6366f1}

  /* Sidebar — mobile: slide-in drawer */
  @media (max-width:640px){
    .log-sidebar{
      position:fixed;top:0;left:0;bottom:0;z-index:150;
      transform:translateX(-100%);
      transition:transform .28s cubic-bezier(.4,0,.2,1);
      width:80vw;max-width:300px;
      box-shadow:4px 0 24px rgba(0,0,0,.3);
    }
    .log-sidebar.open{transform:translateX(0)}
  }

  /* Drawer overlay */
  .drawer-overlay{
    display:none;position:fixed;inset:0;background:var(--drawer-overlay);z-index:140;
  }
  @media (max-width:640px){
    .drawer-overlay.visible{display:block}
  }

  /* Log main area */
  .log-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

  .log-main-header{
    padding:12px 16px;border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    flex-shrink:0;background:var(--bg-header);gap:10px;flex-wrap:wrap;
  }
  .log-day-title{font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-title)}
  .log-day-sub{font-size:10px;color:var(--text-muted);margin-top:1px}
  .log-header-left{display:flex;align-items:center;gap:10px;min-width:0}

  /* Hamburger for mobile log sidebar */
  .menu-btn{
    display:none;background:var(--bg-btn);border:1px solid var(--border-card);
    border-radius:8px;padding:6px 8px;cursor:pointer;font-size:16px;line-height:1;
    color:var(--text-btn);flex-shrink:0;min-width:36px;min-height:36px;
    align-items:center;justify-content:center;
  }
  @media (max-width:640px){.menu-btn{display:flex}}

  .log-actions{display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0}

  /* AI / action buttons */
  .ai-btn{
    padding:7px 11px;border-radius:7px;font-family:'IBM Plex Mono',monospace;
    font-size:10px;letter-spacing:.05em;cursor:pointer;border:none;
    display:flex;align-items:center;gap:5px;transition:background .15s,opacity .15s;
    white-space:nowrap;min-height:34px;
  }
  .ai-btn.day-btn{background:#4f46e5;color:white}
  .ai-btn.day-btn:hover{background:#6366f1}
  .ai-btn.week-btn{background:var(--bg-btn);color:#6366f1;border:1px solid #6366f1}
  .ai-btn.standup-btn{background:var(--standup-bg);color:var(--standup-text);border:1px solid var(--standup-border)}
  .ai-btn.copy-btn{background:var(--bg-btn);color:var(--text-btn);border:1px solid var(--border-card);min-height:30px;padding:5px 10px;font-size:9px}
  .ai-btn.copy-btn.copied{color:#22c55e;border-color:#22c55e}
  .ai-btn.pdf-btn{background:var(--bg-btn);color:var(--text-col);border:1px solid var(--border-card)}
  .ai-btn.pdf-btn:hover{border-color:var(--border-card-h)}
  .ai-btn:disabled{opacity:.45;cursor:not-allowed}

  /* On mobile, make AI buttons smaller */
  @media (max-width:640px){
    .ai-btn{padding:6px 9px;font-size:9px;gap:4px;min-height:32px}
    .ai-btn .ai-label{display:none} /* hide label, keep icon */
    .ai-btn .ai-icon{display:inline}
  }
  @media (min-width:641px){
    .ai-icon{display:none}
  }

  .ai-spinner{width:10px;height:10px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  .log-body{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:16px}
  @media (max-width:640px){.log-body{padding:12px 14px;gap:14px}}

  .log-section-title{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-muted);margin-bottom:8px}
  .done-cards-list{display:flex;flex-direction:column;gap:6px}
  .done-card-chip{display:flex;align-items:flex-start;gap:8px;padding:9px 12px;background:var(--log-entry-bg);border:1px solid var(--log-entry-border);border-radius:8px;font-size:12px;color:var(--text-card)}
  .done-card-check{color:#22c55e;font-size:13px;flex-shrink:0;margin-top:1px}
  .done-card-type{font-size:9px;color:var(--text-muted);margin-top:2px}

  .notes-area{width:100%;background:var(--bg-form);border:1px solid var(--border-form);border-radius:10px;padding:12px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text-card);resize:vertical;min-height:110px;outline:none;line-height:1.6;transition:border-color .15s}
  .notes-area:focus{border-color:#6366f1}
  .notes-area::placeholder{color:var(--text-muted)}

  /* Summary / standup boxes */
  .summary-box{background:var(--summary-bg);border:1px solid var(--summary-border);border-radius:10px;padding:14px 16px}
  .summary-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;flex-wrap:wrap}
  .summary-label{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--summary-text);display:flex;align-items:center;gap:6px}
  .summary-text{font-size:12px;line-height:1.8;color:var(--text-card);white-space:pre-wrap;word-break:break-word}

  .standup-box{background:var(--standup-bg);border:1px solid var(--standup-border);border-radius:10px;padding:14px 16px}
  .standup-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;flex-wrap:wrap}
  .standup-label{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--standup-text);display:flex;align-items:center;gap:6px}
  .standup-section{margin-bottom:12px}
  .standup-section:last-child{margin-bottom:0}
  .standup-section-title{font-size:9px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--standup-text);margin-bottom:5px;opacity:.8}
  .standup-section-body{font-size:12px;line-height:1.7;color:var(--text-card);white-space:pre-wrap;word-break:break-word}

  .week-summary-box{background:var(--summary-bg);border:1px solid var(--summary-border);border-radius:10px;padding:16px 18px}
  .week-summary-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;flex-wrap:wrap}
  .week-summary-title{font-family:'Sora',sans-serif;font-size:14px;font-weight:600;color:var(--text-title)}

  .empty-log{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;gap:10px;text-align:center;padding:40px 20px}
  .empty-log-icon{font-size:36px}
  .empty-log-hint{font-size:10px;opacity:.6}

  /* ── Practicum Report Modal ── */
  .report-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(6px);padding:16px}
  .report-modal{background:var(--bg-modal);border:1px solid var(--border-card);border-radius:16px;width:100%;max-width:620px;max-height:94dvh;overflow-y:auto;display:flex;flex-direction:column}
  .report-modal-header{padding:20px 24px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:0;background:var(--bg-modal);z-index:1;border-radius:16px 16px 0 0}
  .report-modal-title{font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-title)}
  .report-modal-sub{font-size:10px;color:var(--text-muted);margin-top:3px}
  .report-close{background:var(--bg-btn);border:1px solid var(--border-card);border-radius:8px;padding:5px 9px;cursor:pointer;color:var(--text-btn);font-size:14px;line-height:1;flex-shrink:0;min-width:32px;min-height:32px}
  .report-close:hover{color:var(--text-btn-h)}
  .report-modal-body{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
  .report-section{display:flex;flex-direction:column;gap:8px}
  .report-section-title{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-muted);font-weight:500;padding-bottom:6px;border-bottom:1px solid var(--border)}
  .report-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:500px){.report-grid{grid-template-columns:1fr}}
  .report-field{display:flex;flex-direction:column;gap:4px}
  .report-field.full{grid-column:1/-1}
  .report-field label{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em}
  .report-field input,.report-field select,.report-field textarea{background:var(--bg-form);border:1px solid var(--border-form);border-radius:6px;padding:8px 10px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-card);outline:none;transition:border-color .15s;-webkit-appearance:none;width:100%}
  .report-field input:focus,.report-field select:focus,.report-field textarea:focus{border-color:#6366f1}
  .report-field textarea{resize:vertical;min-height:72px;line-height:1.6}
  .report-preview{background:var(--bg-col);border:1px solid var(--border-card);border-radius:10px;padding:16px;font-size:11px;line-height:1.8;color:var(--text-card);white-space:pre-wrap;word-break:break-word;max-height:300px;overflow-y:auto}
  .report-preview-heading{font-size:11px;font-weight:700;color:var(--text-title);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
  .report-preview-block{margin-bottom:16px}
  .report-status{font-size:10px;color:var(--summary-text);display:flex;align-items:center;gap:6px;padding:0 24px 6px}
  .report-status.error{color:#f87171}
  .report-actions{padding:14px 24px 20px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;position:sticky;bottom:0;background:var(--bg-modal);border-radius:0 0 16px 16px}
  .report-btn{flex:1;min-width:120px;padding:10px 16px;border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s;min-height:40px;text-transform:uppercase}
  .report-btn.generate{background:#4f46e5;color:white}
  .report-btn.generate:hover{background:#6366f1}
  .report-btn.docx-dl{background:#1a6b3c;color:white}
  .report-btn.docx-dl:hover{background:#1e8a4c}
  .report-btn.cancel-btn{background:var(--bg-btn);color:var(--text-btn);border:1px solid var(--border-card)}
  .report-btn:disabled{opacity:.45;cursor:not-allowed}
  .report-spinner{width:11px;height:11px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite}
  .ai-btn.report-sm{background:#1a6b3c;color:white;border:none}
  .ai-btn.report-sm:hover{background:#1e8a4c}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens=1000) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}

function CopyButton({ text, label="Copy" }) {
  const [copied,setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch {}
  };
  return <button className={`ai-btn copy-btn${copied?" copied":""}`} onClick={copy}>{copied?"✓ Copied!":"⎘ "+label}</button>;
}

function exportWeekPDF({ weekKey, log, doneTasks, weekSummary }) {
  const weekNum = weekKey.replace("W","");
  const weekDays = Object.entries(log).filter(([k])=>k.startsWith(weekKey)).sort(([a],[b])=>a.localeCompare(b));
  const doneList = doneTasks.map(t=>`• ${t.title} (${t.type})`).join("\n");
  const dayRows = weekDays.map(([key,entry])=>{
    const d=key.split("-D")[1];
    const sp=entry.standup?.split("|||");
    return `
    <div class="day-block">
      <div class="day-title">Day ${d} <span class="day-date">${entry.date||""}</span></div>
      ${entry.notes?`<div class="day-notes"><strong>Notes:</strong><br/>${entry.notes.replace(/\n/g,"<br/>")}</div>`:""}
      ${entry.summary?`<div class="day-summary"><strong>AI Summary:</strong><br/>${entry.summary.replace(/\n/g,"<br/>")}</div>`:""}
      ${sp?`<div class="day-standup"><strong>Standup:</strong><br/>
        <em>✅ Did:</em> ${(sp[0]||"").replace(/\n/g,"<br/>")}<br/>
        <em>🔄 Today:</em> ${(sp[1]||"").replace(/\n/g,"<br/>")}<br/>
        <em>🚧 Blockers:</em> ${(sp[2]||"").replace(/\n/g,"<br/>")}
      </div>`:""}
    </div>`;
  }).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>QE Report — Week ${weekNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;600&display=swap');
  body{font-family:'IBM Plex Mono',monospace;color:#1e293b;max-width:820px;margin:0 auto;padding:40px 32px;background:#fff}
  h1{font-family:'Sora',sans-serif;font-size:24px;color:#0f172a;margin-bottom:4px}
  .subtitle{font-size:11px;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:32px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin:24px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
  .day-block{margin-bottom:18px;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
  .day-title{font-family:'Sora',sans-serif;font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px}
  .day-date{font-size:11px;color:#94a3b8;font-weight:400;margin-left:8px}
  .day-notes,.day-summary,.day-standup{font-size:11px;line-height:1.7;color:#334155;margin-top:8px}
  .day-summary{background:#f0fdf4;padding:8px 10px;border-radius:4px;border-left:3px solid #22c55e}
  .day-standup{background:#eef2ff;padding:8px 10px;border-radius:4px;border-left:3px solid #6366f1}
  .done-list{font-size:11px;line-height:1.9;color:#334155;white-space:pre-wrap}
  .week-summary{font-size:11px;line-height:1.8;color:#334155;white-space:pre-wrap;background:#f0fdf4;padding:14px 16px;border-radius:8px;border:1px solid #bbf7d0}
  .footer{margin-top:40px;font-size:10px;color:#cbd5e1;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px}
  @media print{body{padding:20px}}
</style></head><body>
  <h1>QE Intern Weekly Report</h1>
  <div class="subtitle">Week ${weekNum} &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
  <div class="section-title">✓ Completed Tasks</div>
  <div class="done-list">${doneList||"No completed tasks recorded."}</div>
  <div class="section-title">📓 Daily Logs</div>
  ${dayRows||"<p style='color:#94a3b8;font-size:11px'>No daily logs recorded.</p>"}
  ${weekSummary?`<div class="section-title">✦ AI Week Summary</div><div class="week-summary">${weekSummary.replace(/\n/g,"<br/>")}</div>`:""}
  <div class="footer">Generated by QE Personal Board · Week ${weekNum}</div>
</body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,"_blank");
  if(win) win.onload=()=>{win.focus();win.print();};
}

// ─── Practicum Report DOCX Generator ─────────────────────────────────────────
async function generatePracticumDocx({ meta, sections }) {
  if (!window.docx) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType,
    BorderStyle, WidthType, ShadingType, Table, TableRow, TableCell,
    PageOrientation, UnderlineType
  } = window.docx;

  // A4 Portrait, Normal margins (1 inch = 1440 DXA; normal = 2.54cm ≈ 1440 DXA)
  const PAGE = { width: 11906, height: 16838 }; // A4 in DXA
  const MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 }; // 1 inch normal
  const CONTENT_W = PAGE.width - MARGIN.left - MARGIN.right; // 9026 DXA

  const bdr = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };

  // Info table row
  const infoRow = (label, value) => new TableRow({
    children: [
      new TableCell({
        width: { size: 2700, type: WidthType.DXA }, borders,
        shading: { fill: "EEF2FF", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Arial", size: 22 })] })]
      }),
      new TableCell({
        width: { size: CONTENT_W - 2700, type: WidthType.DXA }, borders,
        margins: { top: 80, bottom: 80, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: value || "", font: "Arial", size: 22 })] })]
      }),
    ]
  });

  // Bold numbered section heading e.g. "I. Tasks and Activities Performed"
  const sectionHeading = (roman, title) => new Paragraph({
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: `${roman}. ${title}`, bold: true, underline: { type: UnderlineType.SINGLE }, font: "Arial", size: 24 })]
  });

  // Body text — split on newlines, indent bullet lines
  const bodyParagraphs = (text) => {
    if (!text) return [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "N/A", font: "Arial", size: 22 })] })];
    return text.split("\n").filter(l => l.trim() !== "").map(line => {
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
      const displayLine = isBullet && line.trim().startsWith("-") ? "• " + line.trim().slice(1).trim() : line.trim();
      return new Paragraph({
        spacing: { after: 100, line: 360, lineRule: "auto" }, // 1.5 line spacing
        indent: isBullet ? { left: 720, hanging: 360 } : {},
        children: [new TextRun({ text: displayLine, font: "Arial", size: 22 })]
      });
    });
  };

  // Empty spacer paragraph
  const spacer = (before = 0, after = 120) => new Paragraph({
    spacing: { before, after },
    children: [new TextRun({ text: "", font: "Arial", size: 22 })]
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } }
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE.width, height: PAGE.height },
          margin: MARGIN,
          orientation: PageOrientation.PORTRAIT
        }
      },
      children: [
        // ── Title ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "WEEKLY PRACTICUM PROGRESS REPORT", bold: true, font: "Arial", size: 28 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [new TextRun({ text: "College of Information Technology", font: "Arial", size: 22, color: "444444" })]
        }),

        // ── Info Table ──
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2700, CONTENT_W - 2700],
          rows: [
            infoRow("Name:", meta.name),
            infoRow("Course & Section:", meta.course),
            infoRow("Practicum Week:", meta.practWeek),
            infoRow("Company/Office:", meta.company),
            infoRow("Position:", meta.position),
          ]
        }),

        spacer(240, 60),

        // ── I. Tasks ──
        sectionHeading("I", "Tasks and Activities Performed"),
        ...bodyParagraphs(sections.tasks),
        spacer(60, 60),

        // ── II. Learning ──
        sectionHeading("II", "Learning Outcomes and Skills Gained"),
        ...bodyParagraphs(sections.learning),
        spacer(60, 60),

        // ── III. Challenges ──
        sectionHeading("III", "Challenges Encountered"),
        ...bodyParagraphs(sections.challenges),
        spacer(60, 60),

        // ── IV. Supervisor ──
        sectionHeading("IV", "Supervisor's Remarks / Feedback"),
        ...bodyParagraphs(sections.supervisor),
        spacer(60, 60),

        // ── V. Proof of Work ──
        sectionHeading("V", "Proof of Work / Engagement"),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({
            text: "(Attach screenshots, photos of tasks, attendance records, or other outputs below.)",
            font: "Arial", size: 22, italics: true, color: "888888"
          })]
        }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Filename format: BSIT4A_Week3_Torres.docx  (section_Week#_Lastname)
  const lastName = (meta.name || "Intern").trim().split(/\s+/).pop();
  const weekLabel = `Week${meta.practWeek.match(/\d+/)?.[0] || "1"}`;
  const sectionClean = (meta.course || "BSIT4A").replace(/\s+/g, "");
  a.download = `${sectionClean}_${weekLabel}_${lastName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Practicum Report Modal ───────────────────────────────────────────────────
function PracticumReportModal({ weekKey, log, doneTasks, allTasks, onClose }) {
  const weekNum = weekKey.replace("W","");
  const weekDays = Object.entries(log).filter(([k])=>k.startsWith(weekKey)).sort(([a],[b])=>a.localeCompare(b));

  // Try to infer date range from day entries
  const dates = weekDays.map(([,e])=>e.date).filter(Boolean);
  const dateRange = dates.length >= 2 ? `${dates[0]} – ${dates[dates.length-1]}` : dates[0] || "";

  const [meta, setMeta] = useState({
    name:"", course:"BSIT 4A", practWeek:`Week ${weekNum} (${dateRange})`,
    company:"", position:"QA Intern", supervisor:""
  });
  const [sections, setSections] = useState({ tasks:"", learning:"", challenges:"", supervisor:"" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState("");
  const [error, setError]     = useState("");
  const [generated, setGenerated] = useState(false);

  const setM = (k,v) => setMeta(m=>({...m,[k]:v}));
  const setS = (k,v) => setSections(s=>({...s,[k]:v}));

  const buildContext = () => {
    const doneList = doneTasks.map(t=>`- ${t.title} (${t.type}, ${t.priority} priority)`).join("\n") || "None recorded";
    const dayLogs  = weekDays.map(([k,e])=>{
      const d = k.split("-D")[1];
      return `Day ${d} (${e.date||""}):\nNotes: ${e.notes||"No notes"}\nSummary: ${e.summary||"No summary"}\nStandup: ${e.standup?.replace(/\|\|\|/g,"\n")||"No standup"}`;
    }).join("\n\n");
    return { doneList, dayLogs };
  };

  const generate = async () => {
    setLoading(true); setError(""); setGenerated(false);
    const { doneList, dayLogs } = buildContext();

    const prompt = `You are writing a formal Weekly Practicum Progress Report for a QA Engineering intern. Follow ALL rules below strictly.

SUBMISSION REQUIREMENTS (MUST FOLLOW):
- Minimum 500 words total across all 4 sections
- Professional, formal academic tone
- First person (I, my, we)
- No markdown formatting (no **, no ##, no backticks)
- No section titles or labels in your response — body text only
- Each section must be at least 2 full paragraphs
- Write flowing narrative prose, not bullet points
- Be specific — mention actual task names, tools, meetings from the logs

INTERN INFO:
Name: ${meta.name || "the intern"}
Course & Section: ${meta.course}
Company/Office: ${meta.company || "the company"}
Position: ${meta.position}
Week: ${meta.practWeek}
Supervisor: ${meta.supervisor || "my supervisor"}

COMPLETED TASKS THIS WEEK:
${doneList}

DAILY LOG DATA (Day 1 to Day 5):
${dayLogs}

OUTPUT FORMAT — respond with EXACTLY 4 sections divided by ===SECTION=== and nothing else before, between, or after:

[Section 1: Tasks and Activities Performed]
===SECTION===
[Section 2: Learning Outcomes and Skills Gained]
===SECTION===
[Section 3: Challenges Encountered — if none, write a short paragraph saying there were no major challenges but briefly mention minor ones if any]
===SECTION===
[Section 4: Supervisor's Remarks / Feedback — write what guidance ${meta.supervisor || "my supervisor"} provided, what feedback was given, how it helped]

IMPORTANT: Total word count must be at least 500 words. Each section must be substantive and detailed.`;

    try {
      setStatus("Generating report with AI...");
      const raw = await callClaude(prompt, 2500);
      const parts = raw.split("===SECTION===").map(p => p.trim());
      if (parts.length >= 4) {
        setSections({ tasks: parts[0], learning: parts[1], challenges: parts[2], supervisor: parts[3] });
        setGenerated(true);
        // Count words
        const totalWords = parts.slice(0,4).join(" ").split(/\s+/).filter(Boolean).length;
        setStatus(`✓ Report generated! ~${totalWords} words. Review and edit below, then download.`);
      } else {
        setError("AI response format unexpected. Please try again.");
      }
    } catch(e) {
      setError("Error generating report. Please try again.");
    }
    setLoading(false);
  };

  const download = async () => {
    setLoading(true); setStatus("Building .docx file...");
    try {
      await generatePracticumDocx({ meta, sections });
      setStatus("✓ Downloaded! Open in Google Docs or Microsoft Word.");
    } catch(e) {
      setError("Error creating file: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e=>e.stopPropagation()}>
        <div className="report-modal-header">
          <div>
            <div className="report-modal-title">📋 Practicum Progress Report</div>
            <div className="report-modal-sub">Week {weekNum} · AI-generated using your daily logs</div>
          </div>
          <button className="report-close" onClick={onClose}>✕</button>
        </div>

        <div className="report-modal-body">
          {/* Meta info */}
          <div className="report-section">
            <div className="report-section-title">Your Information</div>
            <div className="report-grid">
              <div className="report-field"><label>Full Name</label><input placeholder="e.g. Carlos Miguel V. Torres" value={meta.name} onChange={e=>setM("name",e.target.value)}/></div>
              <div className="report-field"><label>Course & Section</label><input placeholder="e.g. BSIT 4A" value={meta.course} onChange={e=>setM("course",e.target.value)}/></div>
              <div className="report-field"><label>Practicum Week</label><input placeholder={`Week ${weekNum} (dates...)`} value={meta.practWeek} onChange={e=>setM("practWeek",e.target.value)}/></div>
              <div className="report-field"><label>Company / Office</label><input placeholder="e.g. Growsari" value={meta.company} onChange={e=>setM("company",e.target.value)}/></div>
              <div className="report-field"><label>Position</label><input placeholder="e.g. QA Intern" value={meta.position} onChange={e=>setM("position",e.target.value)}/></div>
              <div className="report-field"><label>Supervisor Name</label><input placeholder="e.g. Miss Danes" value={meta.supervisor} onChange={e=>setM("supervisor",e.target.value)}/></div>
            </div>
          </div>

          {/* Data preview */}
          <div className="report-section">
            <div className="report-section-title">Data from Week {weekNum} ({weekDays.length} days · {doneTasks.length} completed tasks)</div>
            <div className="report-preview" style={{maxHeight:120}}>
              {weekDays.map(([k,e])=>{
                const d=k.split("-D")[1];
                return <div key={k} style={{marginBottom:6}}>
                  <span style={{color:"var(--standup-text)",fontWeight:600}}>Day {d}</span>
                  {e.date&&<span style={{color:"var(--text-muted)",fontSize:10}}> · {e.date}</span>}
                  {e.notes&&<div style={{color:"var(--text-card)",marginTop:2,paddingLeft:10}}>{e.notes.slice(0,120)}{e.notes.length>120?"…":""}</div>}
                  {!e.notes&&<span style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:10}}> (no notes)</span>}
                </div>;
              })}
            </div>
          </div>

          {/* Generated sections — editable */}
          {generated && (
            <div className="report-section">
              <div className="report-section-title">
                Generated Report — Review & Edit
                <span style={{float:"right", color:"var(--summary-text)", fontWeight:400}}>
                  ~{[sections.tasks,sections.learning,sections.challenges,sections.supervisor].join(" ").split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              {[
                {key:"tasks",     label:"I. Tasks and Activities Performed"},
                {key:"learning",  label:"II. Learning Outcomes and Skills Gained"},
                {key:"challenges",label:"III. Challenges Encountered"},
                {key:"supervisor",label:"IV. Supervisor's Remarks / Feedback"},
              ].map(({key,label})=>(
                <div key={key} className="report-field full" style={{marginBottom:6}}>
                  <label style={{display:"flex",justifyContent:"space-between"}}>
                    <span>{label}</span>
                    <span style={{color:"var(--text-muted)",fontWeight:400,fontSize:9}}>
                      {sections[key].split(/\s+/).filter(Boolean).length} words
                    </span>
                  </label>
                  <textarea value={sections[key]} onChange={e=>setS(key,e.target.value)} style={{minHeight:100}}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {status && <div className={`report-status${error?" error":""}`}>
          {loading && <span className="report-spinner"/>}{error||status}
        </div>}

        <div className="report-actions">
          <button className="report-btn cancel-btn" onClick={onClose}>Cancel</button>
          <button className="report-btn generate" onClick={generate} disabled={loading}>
            {loading&&!generated?<><span className="report-spinner"/>Generating...</>:"✦ Generate with AI"}
          </button>
          {generated && (
            <button className="report-btn docx-dl" onClick={download} disabled={loading}>
              {loading&&generated?<><span className="report-spinner"/>Building...</>:"⬇ Save as .docx"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Board Components ─────────────────────────────────────────────────────────
function KanbanCard({ task, theme, onDragStart, onDelete, onEdit }) {
  const tc = TYPE_COLORS[theme][task.type]||TYPE_COLORS[theme]["Daily To-Do"];
  const overdue  = isOverdue(task.due)  && task.col!=="done";
  const dueToday = isDueToday(task.due) && task.col!=="done";
  return (
    <div className={`card${overdue?" overdue":""}${dueToday&&!overdue?" due-today":""}`}
      draggable onDragStart={e=>onDragStart(e,task.id)}>
      <div className="card-actions">
        <button className="card-btn" onClick={()=>onEdit(task)}>✎</button>
        <button className="card-btn del" onClick={()=>onDelete(task.id)}>✕</button>
      </div>
      <div className="card-type-row">
        <span className="type-badge" style={{background:tc.bg,color:tc.text,borderColor:tc.border}}>{task.type}</span>
        <span className="priority-pip" style={{background:PRIORITY_META[task.priority].color}}/>
      </div>
      <div className="card-title">{task.title}</div>
      {task.notes   && <div className="card-notes">{task.notes}</div>}
      {task.blocker && <div className="card-blocker"><span>🚧</span><span>{task.blocker}</span></div>}
      <div className="card-footer">
        {task.due
          ? <span className={`card-due ${overdue?"overdue":dueToday?"today":"normal"}`}>{overdue?"⚠ ":dueToday?"● ":""}{formatDate(task.due)}{dueToday?" — today":""}</span>
          : <span/>}
      </div>
    </div>
  );
}

function AddCardForm({ onSave, onCancel }) {
  const [form,setForm]=useState({title:"",type:"Daily To-Do",priority:"medium",due:todayStr(),notes:"",blocker:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{if(!form.title.trim())return;onSave(form);};
  return (
    <div className="add-form">
      <input className="form-input" autoFocus placeholder="Task title..." value={form.title}
        onChange={e=>set("title",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}/>
      <div className="form-row">
        <select className="form-select" value={form.type} onChange={e=>set("type",e.target.value)}>
          {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="form-select" value={form.priority} onChange={e=>set("priority",e.target.value)}>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      <input className="form-input" type="date" value={form.due} onChange={e=>set("due",e.target.value)}/>
      <textarea className="form-textarea" placeholder="Notes (optional)..." value={form.notes} onChange={e=>set("notes",e.target.value)}/>
      <textarea className="form-textarea" placeholder="🚧 Blocker (optional)..." value={form.blocker} onChange={e=>set("blocker",e.target.value)} style={{minHeight:40}}/>
      <div className="form-actions">
        <button className="btn-save" onClick={save}>Add Task</button>
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function KanbanColumn({ col, tasks, theme, onDragStart, onDrop, onDragOver, onDragLeave, isOver, onDelete, onEdit, onAdd }) {
  const [adding,setAdding]=useState(false);
  return (
    <div className={`column${isOver?" drag-over":""}`}
      onDrop={e=>onDrop(e,col.id)} onDragOver={onDragOver} onDragLeave={onDragLeave}>
      <div className="col-header">
        <span className="col-dot" style={{background:col.color}}/>
        <span className="col-title">{col.label}</span>
        <span className="col-count">{tasks.length}</span>
      </div>
      <div className="col-body">
        {tasks.map(t=><KanbanCard key={t.id} task={t} theme={theme} onDragStart={onDragStart} onDelete={onDelete} onEdit={onEdit}/>)}
        {adding
          ? <AddCardForm onSave={d=>{onAdd(col.id,d);setAdding(false);}} onCancel={()=>setAdding(false)}/>
          : <button className="add-btn" onClick={()=>setAdding(true)}>+ add task</button>}
      </div>
    </div>
  );
}

function EditModal({ task, onSave, onClose }) {
  const [form,setForm]=useState({...task});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <span className="modal-drag-handle"/>
        <div className="modal-title">Edit Task</div>
        <div><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e=>set("title",e.target.value)}/></div>
        <div className="form-row">
          <div><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e=>set("type",e.target.value)}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e=>set("priority",e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
        </div>
        <div><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due} onChange={e=>set("due",e.target.value)}/></div>
        <div><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Extra context..."/></div>
        <div><label className="form-label">🚧 Blocker</label><textarea className="form-textarea" value={form.blocker} onChange={e=>set("blocker",e.target.value)} style={{minHeight:44}} placeholder="What's blocking?"/></div>
        <div className="form-actions">
          <button className="btn-save" onClick={()=>onSave(form)}>Save</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Day Entry (Log) ──────────────────────────────────────────────────────────
function DayEntry({ dayKey, entry, doneTasks, onNotesChange, onDaySummary, onStandup, onWeekSummary, isLoadingDay, isLoadingStandup, isLoadingWeek, weekSummary, onExportPDF, onOpenSidebar, onOpenReport }) {
  const [week,day]=dayKey.split("-D");
  const summaryCopyText=entry.summary||"";
  const standupParts=entry.standup?entry.standup.split("|||"):null;
  const standupCopyText=standupParts
    ?`STANDUP — ${entry.date||dayKey}\n\n✅ What I Did:\n${standupParts[0]||""}\n\n🔄 Doing Today:\n${standupParts[1]||""}\n\n🚧 Blockers:\n${standupParts[2]||""}`:"";

  return (
    <div className="log-main">
      <div className="log-main-header">
        <div className="log-header-left">
          <button className="menu-btn" onClick={onOpenSidebar}>☰</button>
          <div>
            <div className="log-day-title">Week {week.replace("W","")} · Day {day}</div>
            <div className="log-day-sub">{entry.date||"No date set"}</div>
          </div>
        </div>
        <div className="log-actions">
          <button className="ai-btn standup-btn" onClick={onStandup} disabled={isLoadingStandup}>
            {isLoadingStandup?<><span className="ai-spinner" style={{borderTopColor:"var(--standup-text)"}}/>...</>:<><span className="ai-icon">☀</span><span className="ai-label">☀ Standup</span></>}
          </button>
          <button className="ai-btn week-btn" onClick={onWeekSummary} disabled={isLoadingWeek}>
            {isLoadingWeek?<><span className="ai-spinner" style={{borderTopColor:"#6366f1"}}/>...</>:<><span className="ai-icon">✦W</span><span className="ai-label">✦ Week</span></>}
          </button>
          <button className="ai-btn day-btn" onClick={onDaySummary} disabled={isLoadingDay}>
            {isLoadingDay?<><span className="ai-spinner"/>...</>:<><span className="ai-icon">✦D</span><span className="ai-label">✦ Day</span></>}
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
          {doneTasks.length===0
            ? <div style={{fontSize:11,color:"var(--text-muted)",fontStyle:"italic"}}>Move cards to Done on the board to see them here</div>
            : <div className="done-cards-list">
                {doneTasks.map(t=>(
                  <div className="done-card-chip" key={t.id}>
                    <span className="done-card-check">✓</span>
                    <div><div>{t.title}</div><div className="done-card-type">{t.type} · {t.priority} priority</div></div>
                  </div>
                ))}
              </div>}
        </div>

        {/* Notes */}
        <div>
          <div className="log-section-title">📝 Notes & observations</div>
          <textarea className="notes-area"
            placeholder={"What else did you do today?\n\n• Attended sprint planning\n• Reviewed PR #42\n• 1:1 with mentor..."}
            value={entry.notes||""} onChange={e=>onNotesChange(e.target.value)}/>
        </div>

        {/* Standup */}
        {standupParts && (
          <div className="standup-box">
            <div className="standup-header">
              <div className="standup-label">☀ Daily Standup</div>
              <CopyButton text={standupCopyText} label="Copy Standup"/>
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
              <CopyButton text={summaryCopyText}/>
            </div>
            <div className="summary-text">{entry.summary}</div>
          </div>
        )}

        {/* Week summary */}
        {weekSummary && (
          <div className="week-summary-box">
            <div className="week-summary-header">
              <div className="week-summary-title">✦ Week {week.replace("W","")} Summary</div>
              <CopyButton text={weekSummary}/>
            </div>
            <div className="summary-text">{weekSummary}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile column dots indicator ────────────────────────────────────────────
function ColDots({ count, active }) {
  return (
    <div className="col-dots">
      {Array.from({length:count}).map((_,i)=>(
        <span key={i} className={`col-dot-ind${i===active?" active":""}`}/>
      ))}
    </div>
  );
}

// ─── Week Accordion Sidebar ───────────────────────────────────────────────────
function WeekAccordion({ week, days, log, activeDay, defaultOpen, onSelectDay }) {
  const [open, setOpen] = useState(defaultOpen);
  const weekNum = week.replace("W", "");

  // Auto-open if the active day is inside this week
  useEffect(() => {
    if (days.includes(activeDay)) setOpen(true);
  }, [activeDay, days]);

  const hasActive = days.includes(activeDay);

  // Count how many days have content
  const filledDays = days.filter(dk => {
    const e = log[dk] || {};
    return e.notes || e.summary || e.standup;
  });

  return (
    <div className="week-accordion">
      {/* Week header — click to toggle */}
      <button className="week-accordion-header" onClick={() => setOpen(o => !o)}>
        <span className={`week-chevron${open ? " open" : ""}`}>▶</span>
        <span className={`week-accordion-label${hasActive ? " has-active" : ""}`}>
          Week {weekNum}
        </span>
        {/* Status pips: one dot per day */}
        <span className="week-pips">
          {days.map(dk => {
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
        {days.map(dk => {
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

// ─── Storage ──────────────────────────────────────────────────────────────────
const loadTasks = () => { try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):DEFAULT_TASKS; } catch { return DEFAULT_TASKS; } };
const loadLog   = () => { try { const r=localStorage.getItem(LOG_KEY);     return r?JSON.parse(r):{};          } catch { return {};            } };
const loadTheme = () => { try { return localStorage.getItem(THEME_KEY)||"dark"; } catch { return "dark"; } };

function makeDefaultLog() {
  const t = new Date();
  const fmt = d => d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  // Build Mon–Fri of the current week
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - (4 - i)); // Mon=0 offset, Fri=4 offset from today
    dates.push(fmt(d));
  }

  return {
    "W1-D1": {
      date: dates[0], standup: "",
      summary: "",
      notes: "Started the week with the QA Daily StatusHero Catch-up meeting. The team aligned on sprint priorities and I was assigned RPI regression testing. Ran Route A and B scenarios — all 12 test cases passed without regression. Set up my Jira board for the week."
    },
    "W1-D2": {
      date: dates[1], standup: "",
      summary: "",
      notes: "Performed the Cluster Exclusive simulation and discovered a null route fallback edge case — logged in Jira as QA-204. Attended the company Townhall where Q2 OKRs were discussed. Continued RPI regression in the afternoon, completing the remaining 8 cases and logging 2 defects."
    },
    "W1-D3": {
      date: dates[2], standup: "",
      summary: "",
      notes: "Conducted end-to-end testing of the Store App order flow — found an issue on the cancel step where the status was not updated correctly. Replicated 3 bugs from Shipper App v5.2.0 as requested by the QA lead. Documented steps and attached screenshots to each Jira ticket."
    },
    "W1-D4": {
      date: dates[3], standup: "",
      summary: "",
      notes: "Attended an in-depth Knowledge Transfer session on Returns and Shipper Clearance with Miss Danes. After the session, explored the Returns module independently to identify edge cases — partial returns, rejected clearance, and duplicate shipper IDs. Ran fulfillment scenario tests covering partial delivery, successful delivery, redelivery, and cancelled orders."
    },
    "W1-D5": {
      date: dates[4], standup: "",
      summary: "",
      notes: "Focused on delivery distance scenario testing. Tested Big Boy, Danesari, and Soaferstore for the >250m condition — all returned the correct distance-fail status. Verified Pinoy Big Bottle for the ≤250m pass condition. Wrapped up the week by documenting all 7 test runs and 3 defects in Jira, linking everything to the sprint board."
    },
  };
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,          setTasks]          = useState(loadTasks);
  const [log,            setLog]            = useState(()=>{ const l=loadLog(); return Object.keys(l).length?l:makeDefaultLog(); });
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
  const boardRef = useRef(null);

  // Apply theme CSS vars
  useEffect(() => {
    Object.entries(THEME[theme]).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
    try { localStorage.setItem(THEME_KEY,theme); } catch {}
  }, [theme]);

  useEffect(()=>{ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));}catch{} },[tasks]);
  useEffect(()=>{ try{localStorage.setItem(LOG_KEY,JSON.stringify(log));}catch{} },[log]);

  // Track which column is visible on mobile board (scroll snapping)
  useEffect(()=>{
    const board=boardRef.current; if(!board) return;
    const onScroll=()=>{
      const idx=Math.round(board.scrollLeft/board.offsetWidth);
      setActiveColIdx(idx);
    };
    board.addEventListener("scroll",onScroll,{passive:true});
    return()=>board.removeEventListener("scroll",onScroll);
  },[]);

  const toggleTheme     = useCallback(()=>setTheme(t=>t==="dark"?"light":"dark"),[]);
  const handleDragStart = useCallback((e,id)=>{setDragId(id);e.dataTransfer.effectAllowed="move";},[]);
  const handleDragOver  = useCallback(e=>e.preventDefault(),[]);
  const handleDrop      = useCallback((e,colId)=>{
    e.preventDefault(); if(!dragId) return;
    setTasks(p=>p.map(t=>t.id===dragId?{...t,col:colId}:t));
    setDragId(null); setOverCol(null);
  },[dragId]);
  const handleDelete    = useCallback(id=>setTasks(p=>p.filter(t=>t.id!==id)),[]);
  const handleAdd       = useCallback((colId,data)=>setTasks(p=>[...p,{id:newId(),col:colId,...data}]),[]);
  const handleSaveEdit  = useCallback(u=>{setTasks(p=>p.map(t=>t.id===u.id?u:t));setEditing(null);},[]);
  const updateLog       = (key,patch)=>setLog(p=>({...p,[key]:{...p[key],...patch}}));

  const addDay = () => {
    const wks=[...new Set(Object.keys(log).map(k=>k.split("-")[0]))];
    const lw=wks[wks.length-1]||"W1";
    const din=Object.keys(log).filter(k=>k.startsWith(lw)).length;
    let nk=din<5?`${lw}-D${din+1}`:`W${+lw.replace("W","")+1}-D1`;
    const fmt=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    setLog(p=>({...p,[nk]:{date:fmt,notes:"",summary:"",standup:""}}));
    setActiveDay(nk); setSidebarOpen(false);
  };

  const summarizeDay = async () => {
    setLoadingDay(true);
    const entry=log[activeDay]||{}; const [week,day]=activeDay.split("-D");
    const doneList=tasks.filter(t=>t.col==="done").map(t=>`- ${t.title} (${t.type})`).join("\n")||"None";
    try {
      const summary=await callClaude(`Summarize the daily work log of a QA Engineering intern.\nWeek ${week.replace("W","")}, Day ${day} — ${entry.date||""}\nCOMPLETED:\n${doneList}\nNOTES:\n${entry.notes||"No notes."}\nWrite a concise 3–5 sentence professional summary in first person.`);
      updateLog(activeDay,{summary});
    } catch { updateLog(activeDay,{summary:"Error generating summary."}); }
    setLoadingDay(false);
  };

  const generateStandup = async () => {
    setLoadingStandup(true);
    const entry=log[activeDay]||{}; const [week,day]=activeDay.split("-D");
    const doneList=tasks.filter(t=>t.col==="done").map(t=>`- ${t.title}`).join("\n")||"None";
    const inProg=tasks.filter(t=>t.col==="inprogress").map(t=>`- ${t.title}`).join("\n")||"None";
    const blockers=tasks.filter(t=>t.blocker).map(t=>`- ${t.title}: ${t.blocker}`).join("\n")||"None";
    try {
      const raw=await callClaude(`Generate standup for QA intern. Week ${week.replace("W","")}, Day ${day}.\nDONE: ${doneList}\nIN PROGRESS: ${inProg}\nBLOCKERS: ${blockers}\nNOTES: ${entry.notes||"None"}\nRespond with EXACTLY three sections separated by "|||" (no labels, no extra text):\n[2-4 bullet points of what was done yesterday]|||[2-4 bullet points for today]|||[blockers or "No blockers today."]`);
      updateLog(activeDay,{standup:raw.trim()});
    } catch { updateLog(activeDay,{standup:"Error|||Error|||Error"}); }
    setLoadingStandup(false);
  };

  const summarizeWeek = async () => {
    setLoadingWeek(true);
    const [weekKey]=activeDay.split("-D");
    const weekDays=Object.entries(log).filter(([k])=>k.startsWith(weekKey));
    const doneList=tasks.filter(t=>t.col==="done").map(t=>`- ${t.title} (${t.type})`).join("\n")||"None";
    const dayBreakdowns=weekDays.map(([k,e])=>`Day ${k.split("-D")[1]} (${e.date||""}): ${e.notes||"No notes"}${e.summary?`\n${e.summary}`:""}`).join("\n\n");
    try {
      const summary=await callClaude(`Weekly summary for QA intern. Week ${weekKey.replace("W","")}.\nDAILY LOGS:\n${dayBreakdowns}\nCOMPLETED:\n${doneList}\nWrite structured summary with: 1. Overall Achievements 2. Key Learnings 3. Challenges & Blockers 4. Next Week Focus. Professional, first person.`);
      setWeekSummaries(p=>({...p,[weekKey]:summary}));
    } catch { setWeekSummaries(p=>({...p,[weekKey]:"Error generating summary."})); }
    setLoadingWeek(false);
  };

  const handleExportPDF=()=>{
    const [weekKey]=activeDay.split("-D");
    exportWeekPDF({weekKey,log,doneTasks:tasks.filter(t=>t.col==="done"),weekSummary:weekSummaries[weekKey]});
  };

  // Group log by week
  const weeks={};
  Object.keys(log).sort().forEach(k=>{ const [w]=k.split("-D"); if(!weeks[w])weeks[w]=[]; weeks[w].push(k); });

  const doneStat    = tasks.filter(t=>t.col==="done").length;
  const overdueStat = tasks.filter(t=>isOverdue(t.due)&&t.col!=="done").length;
  const blockedStat = tasks.filter(t=>t.blocker&&t.col!=="done").length;
  const dateStr     = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const [activeWeek]=activeDay.split("-D");

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-left">
            <div className="header-title">My QE Board</div>
            <div className="header-date">{dateStr}</div>
          </div>
          <div className="header-right">
            <div className="header-stats">
              <div className="stat"><span className="stat-num" style={{color:"#22c55e"}}>{doneStat}</span><span className="stat-label">Done</span></div>
              <div className="stat-div"/>
              <div className="stat"><span className="stat-num" style={{color:overdueStat>0?"#ef4444":"var(--text-muted)"}}>{overdueStat}</span><span className="stat-label">Overdue</span></div>
              <div className="stat-div"/>
              <div className="stat"><span className="stat-num" style={{color:blockedStat>0?"#f59e0b":"var(--text-muted)"}}>{blockedStat}</span><span className="stat-label">Blocked</span></div>
            </div>
            <button className="theme-toggle" onClick={toggleTheme}>
              <span className={`toggle-pill${theme==="light"?" active":""}`}>☀️</span>
              <span className={`toggle-pill${theme==="dark" ?" active":""}`}>🌙</span>
            </button>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div className="tabs">
          <button className={`tab${activeTab==="board"?" active":""}`} onClick={()=>setActiveTab("board")}>📋 Kanban Board</button>
          <button className={`tab${activeTab==="log"  ?" active":""}`} onClick={()=>setActiveTab("log")}>📓 Daily Log</button>
        </div>

        {/* ── Board Tab ── */}
        {activeTab==="board" && (
          <>
            <div className="board" ref={boardRef}>
              {COLUMNS.map(col=>(
                <KanbanColumn key={col.id} col={col} theme={theme}
                  tasks={tasks.filter(t=>t.col===col.id)}
                  onDragStart={handleDragStart} onDrop={handleDrop}
                  onDragOver={e=>{handleDragOver(e);setOverCol(col.id);}}
                  onDragLeave={()=>setOverCol(null)}
                  isOver={overCol===col.id}
                  onDelete={handleDelete} onEdit={setEditing} onAdd={handleAdd}
                />
              ))}
            </div>
            {/* Mobile swipe dots */}
            <ColDots count={COLUMNS.length} active={activeColIdx}/>
          </>
        )}

        {/* ── Daily Log Tab ── */}
        {activeTab==="log" && (
          <div className="log-page">
            {/* Mobile drawer overlay */}
            <div className={`drawer-overlay${sidebarOpen?" visible":""}`} onClick={()=>setSidebarOpen(false)}/>

            {/* Sidebar */}
            <div className={`log-sidebar${sidebarOpen?" open":""}`}>
              <div className="log-sidebar-title">Internship Log</div>
              <div className="log-sidebar-list">
                {Object.entries(weeks).map(([week,days])=>(
                  <WeekAccordion
                    key={week}
                    week={week}
                    days={days}
                    log={log}
                    activeDay={activeDay}
                    defaultOpen={week===activeWeek}
                    onSelectDay={dk=>{setActiveDay(dk);setSidebarOpen(false);}}
                  />
                ))}
              </div>
              <button className="add-day-btn" onClick={addDay}>+ add day</button>
            </div>

            {/* Main log area */}
            {log[activeDay]
              ? <DayEntry
                  dayKey={activeDay} entry={log[activeDay]}
                  doneTasks={tasks.filter(t=>t.col==="done")}
                  onNotesChange={v=>updateLog(activeDay,{notes:v})}
                  onDaySummary={summarizeDay} onStandup={generateStandup}
                  onWeekSummary={summarizeWeek}
                  isLoadingDay={loadingDay} isLoadingStandup={loadingStandup} isLoadingWeek={loadingWeek}
                  weekSummary={weekSummaries[activeWeek]}
                  onExportPDF={handleExportPDF}
                  onOpenSidebar={()=>setSidebarOpen(true)}
                  onOpenReport={()=>setShowReport(true)}
                />
              : <div className="log-main">
                  <div className="log-main-header">
                    <button className="menu-btn" onClick={()=>setSidebarOpen(true)}>☰</button>
                  </div>
                  <div className="empty-log">
                    <span className="empty-log-icon">📓</span>
                    <span>Select a day to view your log</span>
                    <span className="empty-log-hint">Tap ☰ to open the day list</span>
                  </div>
                </div>
            }
          </div>
        )}
      </div>

      {editing && <EditModal task={editing} onSave={handleSaveEdit} onClose={()=>setEditing(null)}/>}
      {showReport && (
        <PracticumReportModal
          weekKey={activeWeek}
          log={log}
          doneTasks={tasks.filter(t=>t.col==="done")}
          allTasks={tasks}
          onClose={()=>setShowReport(false)}
        />
      )}
    </>
  );
}

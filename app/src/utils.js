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
export const DEFAULT_TASKS = [
  // ── Day 1 (Monday) ──
  { id: newId(), col: "done", title: "Attend QA Daily StatusHero Catch-up",         type: "Daily To-Do", priority: "high",   due: todayStr(-4), notes: "Team shared blockers and sprint priorities. Discussed RPI regression scope.", blocker: "" },
  { id: newId(), col: "done", title: "RPI Regression Testing – Route A & B",        type: "Test Case",   priority: "high",   due: todayStr(-4), notes: "Verified routing scenarios after latest deploy. All 12 cases passed.",      blocker: "" },
  // ── Day 2 (Tuesday) ──
  { id: newId(), col: "done", title: "Cluster Exclusive Simulation",                type: "Test Case",   priority: "high",   due: todayStr(-3), notes: "Tested exclusive cluster config. Found 1 edge case with null route fallback.", blocker: "" },
  { id: newId(), col: "done", title: "Company Townhall Meeting",                    type: "Daily To-Do", priority: "medium", due: todayStr(-3), notes: "Org updates, OKRs for Q2, and department announcements.",                    blocker: "" },
  { id: newId(), col: "done", title: "Continue RPI Regression – pending cases",     type: "Test Case",   priority: "high",   due: todayStr(-3), notes: "Completed remaining 8 test cases. Logged 2 defects in Jira.",               blocker: "" },
  // ── Day 3 (Wednesday) ──
  { id: newId(), col: "done", title: "End-to-End Testing: Store App Order Flow",    type: "Test Case",   priority: "high",   due: todayStr(-2), notes: "Tested full order cycle: create → confirm → fulfill. Found issue on cancel step.", blocker: "" },
  { id: newId(), col: "done", title: "Replicate Shipper App v5.2.0 Bugs",           type: "Bug Report",  priority: "high",   due: todayStr(-2), notes: "Reproduced 3 reported bugs. Documented steps and screenshots in Jira.",       blocker: "" },
  // ── Day 4 (Thursday) ──
  { id: newId(), col: "done", title: "KT Session: Returns & Shipper Clearance",     type: "Learning",    priority: "medium", due: todayStr(-1), notes: "In-depth walkthrough by Miss Danes. Covered full returns lifecycle and clearance workflow.", blocker: "" },
  { id: newId(), col: "done", title: "Explore Returns Module Independently",        type: "Learning",    priority: "medium", due: todayStr(-1), notes: "Mapped out edge cases: partial returns, rejected clearance, duplicate shipper IDs.", blocker: "" },
  { id: newId(), col: "done", title: "Test Order Fulfillment Scenarios (no distance)", type: "Test Case", priority: "high",  due: todayStr(-1), notes: "Tested: partial delivery, successful delivery, redelivery, cancelled orders.",  blocker: "" },
  // ── Day 5 (Friday) ──
  { id: newId(), col: "done", title: "Delivery Distance Testing (>250m)",           type: "Test Case",   priority: "high",   due: todayStr(0),  notes: "Stores: Big Boy, Danesari, Soaferstore. All 3 returned correct distance-fail status.", blocker: "" },
  { id: newId(), col: "done", title: "Delivery Distance Testing (≤250m)",           type: "Test Case",   priority: "high",   due: todayStr(0),  notes: "Validated Pinoy Big Bottle. Distance-pass scenario working as expected.",      blocker: "" },
  { id: newId(), col: "done", title: "Document all test results in Jira",           type: "Daily To-Do", priority: "medium", due: todayStr(0),  notes: "Logged 7 test runs, 3 defects, 1 observation. Linked to sprint board.",        blocker: "" },
  // ── Active tasks still in progress ──
  { id: newId(), col: "inprogress", title: "Write test cases for Checkout v2 flow", type: "Test Case",   priority: "medium", due: todayStr(2),  notes: "Focus on payment gateway edge cases", blocker: "" },
  { id: newId(), col: "todo",       title: "Read: Cypress Best Practices docs",     type: "Learning",    priority: "low",    due: todayStr(4),  notes: "Focus on custom commands and fixtures chapter", blocker: "" },
  { id: newId(), col: "blocked",    title: "Automate RPI regression suite",         type: "Test Case",   priority: "high",   due: todayStr(3),  notes: "Cypress scripts drafted", blocker: "Waiting for test environment credentials from DevOps" },
];

export function makeDefaultLog() {
  const t = new Date();
  const fmt = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - (4 - i));
    dates.push(fmt(d));
  }

  return {
    "W1-D1": {
      date: dates[0], standup: "", summary: "",
      notes: "Started the week with the QA Daily StatusHero Catch-up meeting. The team aligned on sprint priorities and I was assigned RPI regression testing. Ran Route A and B scenarios — all 12 test cases passed without regression. Set up my Jira board for the week.",
    },
    "W1-D2": {
      date: dates[1], standup: "", summary: "",
      notes: "Performed the Cluster Exclusive simulation and discovered a null route fallback edge case — logged in Jira as QA-204. Attended the company Townhall where Q2 OKRs were discussed. Continued RPI regression in the afternoon, completing the remaining 8 cases and logging 2 defects.",
    },
    "W1-D3": {
      date: dates[2], standup: "", summary: "",
      notes: "Conducted end-to-end testing of the Store App order flow — found an issue on the cancel step where the status was not updated correctly. Replicated 3 bugs from Shipper App v5.2.0 as requested by the QA lead. Documented steps and attached screenshots to each Jira ticket.",
    },
    "W1-D4": {
      date: dates[3], standup: "", summary: "",
      notes: "Attended an in-depth Knowledge Transfer session on Returns and Shipper Clearance with Miss Danes. After the session, explored the Returns module independently to identify edge cases — partial returns, rejected clearance, and duplicate shipper IDs. Ran fulfillment scenario tests covering partial delivery, successful delivery, redelivery, and cancelled orders.",
    },
    "W1-D5": {
      date: dates[4], standup: "", summary: "",
      notes: "Focused on delivery distance scenario testing. Tested Big Boy, Danesari, and Soaferstore for the >250m condition — all returned the correct distance-fail status. Verified Pinoy Big Bottle for the ≤250m pass condition. Wrapped up the week by documenting all 7 test runs and 3 defects in Jira, linking everything to the sprint board.",
    },
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

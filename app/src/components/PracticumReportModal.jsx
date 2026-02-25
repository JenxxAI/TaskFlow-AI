import { useState } from "react";
import { callGemini, generatePracticumDocx } from "../api";

export default function PracticumReportModal({ weekKey, log, doneTasks, allTasks, onClose }) {
  const weekNum = weekKey.replace("W", "");
  const weekDays = Object.entries(log)
    .filter(([k]) => k.startsWith(weekKey))
    .sort(([a], [b]) => a.localeCompare(b));

  // Try to infer date range from day entries
  const dates = weekDays.map(([, e]) => e.date).filter(Boolean);
  const dateRange = dates.length >= 2 ? `${dates[0]} – ${dates[dates.length - 1]}` : dates[0] || "";

  const [meta, setMeta] = useState({
    name: "", course: "BSIT 4A", practWeek: `Week ${weekNum} (${dateRange})`,
    company: "", position: "QA Intern", supervisor: "",
  });
  const [sections, setSections] = useState({ tasks: "", learning: "", challenges: "", supervisor: "" });
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState("");
  const [generated, setGenerated] = useState(false);

  const setM = (k, v) => setMeta((m) => ({ ...m, [k]: v }));
  const setS = (k, v) => setSections((s) => ({ ...s, [k]: v }));

  const buildContext = () => {
    const doneList = doneTasks.map((t) => `- ${t.title} (${t.type}, ${t.priority} priority)`).join("\n") || "None recorded";
    const dayLogs = weekDays.map(([k, e]) => {
      const d = k.split("-D")[1];
      return `Day ${d} (${e.date || ""}):\nNotes: ${e.notes || "No notes"}\nSummary: ${e.summary || "No summary"}\nStandup: ${e.standup?.replace(/\|\|\|/g, "\n") || "No standup"}`;
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
      const raw = await callGemini(prompt, 2500);
      const parts = raw.split("===SECTION===").map((p) => p.trim());
      if (parts.length >= 4) {
        setSections({ tasks: parts[0], learning: parts[1], challenges: parts[2], supervisor: parts[3] });
        setGenerated(true);
        const totalWords = parts.slice(0, 4).join(" ").split(/\s+/).filter(Boolean).length;
        setStatus(`✓ Report generated! ~${totalWords} words. Review and edit below, then download.`);
      } else {
        setError("AI response format unexpected. Please try again.");
      }
    } catch (e) {
      setError("Error generating report. Please try again.");
    }
    setLoading(false);
  };

  const download = async () => {
    setLoading(true); setStatus("Building .docx file...");
    try {
      await generatePracticumDocx({ meta, sections });
      setStatus("✓ Downloaded! Open in Google Docs or Microsoft Word.");
    } catch (e) {
      setError("Error creating file: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
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
              <div className="report-field"><label>Full Name</label><input placeholder="e.g. Carlos Miguel V. Torres" value={meta.name} onChange={(e) => setM("name", e.target.value)} /></div>
              <div className="report-field"><label>Course & Section</label><input placeholder="e.g. BSIT 4A" value={meta.course} onChange={(e) => setM("course", e.target.value)} /></div>
              <div className="report-field"><label>Practicum Week</label><input placeholder={`Week ${weekNum} (dates...)`} value={meta.practWeek} onChange={(e) => setM("practWeek", e.target.value)} /></div>
              <div className="report-field"><label>Company / Office</label><input placeholder="e.g. Growsari" value={meta.company} onChange={(e) => setM("company", e.target.value)} /></div>
              <div className="report-field"><label>Position</label><input placeholder="e.g. QA Intern" value={meta.position} onChange={(e) => setM("position", e.target.value)} /></div>
              <div className="report-field"><label>Supervisor Name</label><input placeholder="e.g. Miss Danes" value={meta.supervisor} onChange={(e) => setM("supervisor", e.target.value)} /></div>
            </div>
          </div>

          {/* Data preview */}
          <div className="report-section">
            <div className="report-section-title">Data from Week {weekNum} ({weekDays.length} days · {doneTasks.length} completed tasks)</div>
            <div className="report-preview" style={{ maxHeight: 120 }}>
              {weekDays.map(([k, e]) => {
                const d = k.split("-D")[1];
                return (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <span style={{ color: "var(--standup-text)", fontWeight: 600 }}>Day {d}</span>
                    {e.date && <span style={{ color: "var(--text-muted)", fontSize: 10 }}> · {e.date}</span>}
                    {e.notes && <div style={{ color: "var(--text-card)", marginTop: 2, paddingLeft: 10 }}>{e.notes.slice(0, 120)}{e.notes.length > 120 ? "…" : ""}</div>}
                    {!e.notes && <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 10 }}> (no notes)</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated sections — editable */}
          {generated && (
            <div className="report-section">
              <div className="report-section-title">
                Generated Report — Review & Edit
                <span style={{ float: "right", color: "var(--summary-text)", fontWeight: 400 }}>
                  ~{[sections.tasks, sections.learning, sections.challenges, sections.supervisor].join(" ").split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              {[
                { key: "tasks",      label: "I. Tasks and Activities Performed" },
                { key: "learning",   label: "II. Learning Outcomes and Skills Gained" },
                { key: "challenges", label: "III. Challenges Encountered" },
                { key: "supervisor", label: "IV. Supervisor's Remarks / Feedback" },
              ].map(({ key, label }) => (
                <div key={key} className="report-field full" style={{ marginBottom: 6 }}>
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{label}</span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 9 }}>
                      {sections[key].split(/\s+/).filter(Boolean).length} words
                    </span>
                  </label>
                  <textarea value={sections[key]} onChange={(e) => setS(key, e.target.value)} style={{ minHeight: 100 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {status && (
          <div className={`report-status${error ? " error" : ""}`}>
            {loading && <span className="report-spinner" />}{error || status}
          </div>
        )}

        <div className="report-actions">
          <button className="report-btn cancel-btn" onClick={onClose}>Cancel</button>
          <button className="report-btn generate" onClick={generate} disabled={loading}>
            {loading && !generated ? <><span className="report-spinner" />Generating...</> : "✦ Generate with AI"}
          </button>
          {generated && (
            <button className="report-btn docx-dl" onClick={download} disabled={loading}>
              {loading && generated ? <><span className="report-spinner" />Building...</> : "⬇ Save as .docx"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

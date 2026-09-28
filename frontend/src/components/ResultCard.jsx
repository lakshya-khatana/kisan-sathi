import SeverityBadge from "./SeverityBadge.jsx";

const CONF = { high: "#2e7d32", medium: "#f9a825", low: "#ef6c00" };

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="result-section">
      <h4>{title}</h4>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;

  if (result.photo_ok === false) {
    return (
      <div className="card result-card">
        <h3>📷 Please retake the photo</h3>
        <p>{result.photo_issue}</p>
      </div>
    );
  }

  const r = result;
  return (
    <div className="card result-card">
      <div className="result-header">
        <div>
          <p className="muted small">{r.crop}</p>
          <h2>{r.is_healthy ? "✅ " : "🦠 "}{r.disease}</h2>
          {r.scientific_name && <p className="muted small"><i>{r.scientific_name}</i></p>}
        </div>
        <div className="badge-col">
          <SeverityBadge severity={r.severity} />
          <span className="severity-badge" style={{ backgroundColor: CONF[r.confidence] || "#616161" }}>
            CONFIDENCE: {r.confidence?.toUpperCase()}
          </span>
        </div>
      </div>

      {r.confidence === "low" && (
        <p className="notice">Confidence is low — please confirm with a local agriculture expert before spraying anything.</p>
      )}

      {r.urgency && <div className="recommendation-box"><h3>What to do now</h3><p>{r.urgency}</p></div>}
      <List title="What the photo shows" items={r.visible_symptoms} />
      {r.cause && <div className="result-section"><h4>Cause</h4><p>{r.cause}</p></div>}
      <List title="Organic / low-cost options" items={r.organic_treatment} />
      <List title="Chemical options" items={r.chemical_treatment} />
      <List title="Prevention" items={r.prevention} />

      {r.alternatives?.length > 0 && (
        <div className="result-section">
          <h4>Could also be</h4>
          <ul>{r.alternatives.map((a, i) => <li key={i}><b>{a.name}</b> — {a.why}</li>)}</ul>
        </div>
      )}
      {r.see_expert_if && <p className="notice"><b>See an expert if:</b> {r.see_expert_if}</p>}
      <p className="muted small">AI-generated guidance, not a lab diagnosis. Always follow the pesticide label.</p>
    </div>
  );
}

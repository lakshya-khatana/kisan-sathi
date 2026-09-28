import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate } from "../constants.js";
import SeverityBadge from "./SeverityBadge.jsx";

export default function HistoryPanel({ refreshKey }) {
  const [scans, setScans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/scans/").then(setScans).catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <p className="error-text">{error}</p>;
  if (!scans) return <p className="muted">Loading...</p>;
  if (scans.length === 0) return <p className="empty">No scans yet. Upload your first leaf photo in the "Scan leaf" tab.</p>;

  return (
    <div className="stack">
      {scans.map((s) => (
        <div className="card list-item" key={s.id}>
          <div className="list-row">
            <div>
              <h3>{s.crop} — {s.disease}</h3>
              <p className="muted small">{formatDate(s.created_at)} · confidence: {s.confidence}</p>
            </div>
            <SeverityBadge severity={s.severity} />
          </div>
          <p className="small">{s.details?.urgency}</p>
        </div>
      ))}
    </div>
  );
}

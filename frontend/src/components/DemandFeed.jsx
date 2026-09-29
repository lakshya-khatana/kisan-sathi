import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate } from "../constants.js";

export default function DemandFeed({ mine = false, refreshKey = 0 }) {
  const [items, setItems] = useState(null);
  const [cropFilter, setCropFilter] = useState("");
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const query = mine ? "?mine=1" : cropFilter ? `?crop=${encodeURIComponent(cropFilter)}` : "";
    api.get(`/demands/${query}`).then(setItems).catch((e) => setError(e.message));
  }, [mine, cropFilter, refreshKey, reload]);

  const remove = async (id) => {
    if (!window.confirm("Mark this request as fulfilled and remove it?")) return;
    try { await api.del(`/demands/${id}/`); setReload((n) => n + 1); }
    catch (e) { setError(e.message); }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!items) return <p className="muted">Loading...</p>;

  return (
    <div className="stack">
      {!mine && (
        <label>Filter by crop <span className="muted small">(optional)</span>
          <input value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}
                 placeholder="e.g. Wheat" maxLength={80} />
        </label>
      )}

      {items.length === 0 && (
        <p className="empty">
          {mine ? "You haven't posted any requirement yet." : "No open requirements right now. Check back soon."}
        </p>
      )}

      {items.map((d) => (
        <article className="card list-item" key={d.id}>
          <div className="list-row">
            <span className="tag tag-crop">🌾 {d.crop}</span>
            {d.budget && <span className="tag tag-price">💰 {d.budget}</span>}
          </div>
          <h3>{d.quantity} needed in {d.location}</h3>
          {d.notes && <p className="message">{d.notes}</p>}
          <p><b>📞 Contact:</b> {d.contact_phone}</p>
          <div className="list-row">
            <p className="muted small">By {d.consumer_name} · {formatDate(d.created_at)}</p>
            {mine && <button className="link-btn danger" onClick={() => remove(d.id)}>Mark fulfilled</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

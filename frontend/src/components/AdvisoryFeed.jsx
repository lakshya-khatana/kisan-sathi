import { useEffect, useState } from "react";
import { api } from "../api.js";
import { CATEGORIES, formatDate } from "../constants.js";

export default function AdvisoryFeed({ mine = false, refreshKey = 0 }) {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api.get(`/advisories/${mine ? "?mine=1" : ""}`).then(setItems).catch((e) => setError(e.message));
  }, [mine, refreshKey, reload]);

  const remove = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.del(`/advisories/${id}/`); setReload((n) => n + 1); }
    catch (e) { setError(e.message); }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!items) return <p className="muted">Loading...</p>;

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="stack">
      {!mine && (
        <div className="chips">
          {["all", ...Object.keys(CATEGORIES)].map((key) => (
            <button key={key} className={`chip ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
              {key === "all" ? "All" : CATEGORIES[key].label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="empty">{mine ? "You haven't posted anything yet." : "No posts here yet. Check back soon."}</p>
      )}

      {visible.map((a) => (
        <article className="card list-item" key={a.id}>
          <div className="list-row">
            <span className={`tag tag-${a.category}`}>{CATEGORIES[a.category]?.icon} {CATEGORIES[a.category]?.label}</span>
            {a.crop && <span className="tag tag-crop">🌾 {a.crop}</span>}
          </div>
          <h3>{a.title}</h3>
          <p className="message">{a.message}</p>
          <div className="list-row">
            <p className="muted small">By {a.author_name} · {formatDate(a.created_at)}</p>
            {mine && <button className="link-btn danger" onClick={() => remove(a.id)}>Delete</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

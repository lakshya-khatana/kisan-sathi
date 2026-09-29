import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate } from "../constants.js";
import BuyRequestForm from "./BuyRequestForm.jsx";

const digits = (v) => (v || "").replace(/\D/g, "").slice(-10);

export default function ProduceFeed({ mine = false, refreshKey = 0, canBuy = false, onRequested }) {
  const [items, setItems] = useState(null);
  const [cropFilter, setCropFilter] = useState("");
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [buyingId, setBuyingId] = useState(null);
  const [sentId, setSentId] = useState(null);

  useEffect(() => {
    const query = mine ? "?mine=1" : cropFilter ? `?crop=${encodeURIComponent(cropFilter)}` : "";
    api.get(`/produce/${query}`).then(setItems).catch((e) => setError(e.message));
  }, [mine, cropFilter, refreshKey, reload]);

  const remove = async (id) => {
    if (!window.confirm("Mark this listing as sold out and remove it?")) return;
    try { await api.del(`/produce/${id}/`); setReload((n) => n + 1); }
    catch (e) { setError(e.message); }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!items) return <p className="muted">Loading...</p>;

  return (
    <div className="stack">
      {!mine && (
        <label>Filter by crop <span className="muted small">(optional)</span>
          <input value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}
                 placeholder="e.g. Tomato" maxLength={80} />
        </label>
      )}

      {items.length === 0 && (
        <p className="empty">
          {mine ? "You haven't listed any produce yet." : "No produce listed right now. Check back soon."}
        </p>
      )}

      {items.map((p) => (
        <article className="card list-item" key={p.id}>
          <div className="list-row">
            <span className="tag tag-crop">🌾 {p.crop}</span>
            {p.price && <span className="tag tag-price">💰 {p.price}</span>}
          </div>
          <h3>{p.quantity} available in {p.location}</h3>
          {p.notes && <p className="message">{p.notes}</p>}
          <p><b>📞 Contact:</b> {p.contact_phone}</p>
          {canBuy && !mine && (
            <>
              <div className="list-row action-row">
                {sentId === p.id
                  ? <span className="success-text">✅ Request bhej di! "Sent requests" tab me status dekho.</span>
                  : <button className="btn btn-primary" onClick={() => setBuyingId(buyingId === p.id ? null : p.id)}>🛒 Buy request bhejo</button>}
                {digits(p.contact_phone) && <a className="btn btn-outline" href={`tel:+91${digits(p.contact_phone)}`}>📞 Call</a>}
                {digits(p.contact_phone) && (
                  <a className="btn btn-outline" target="_blank" rel="noreferrer"
                     href={`https://wa.me/91${digits(p.contact_phone)}?text=${encodeURIComponent(`Namaste, mujhe aapka ${p.crop} chahiye. Kya abhi available hai?`)}`}>💬 WhatsApp</a>
                )}
              </div>
              {buyingId === p.id && (
                <BuyRequestForm listing={p}
                  onCancel={() => setBuyingId(null)}
                  onDone={() => { setBuyingId(null); setSentId(p.id); onRequested?.(); }} />
              )}
            </>
          )}
          <div className="list-row">
            <p className="muted small">By {p.farmer_name} · {formatDate(p.created_at)}</p>
            {mine && <button className="link-btn danger" onClick={() => remove(p.id)}>Mark sold out</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate } from "../constants.js";

const STATUS_LABEL = { pending: "⏳ Pending", accepted: "✅ Accepted", rejected: "❌ Rejected" };
const digits = (v) => (v || "").replace(/\D/g, "").slice(-10);

// role="farmer"   -> incoming requests, with Accept / Reject
// role="consumer" -> requests I have sent, with status
export default function BuyRequestList({ role, refreshKey = 0 }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const isFarmer = role === "farmer";

  useEffect(() => {
    api.get("/buy-requests/").then(setItems).catch((e) => setError(e.message));
  }, [refreshKey, reload]);

  const respond = async (id, status) => {
    try { await api.post(`/buy-requests/${id}/respond/`, { status }); setReload((n) => n + 1); }
    catch (e) { setError(e.message); }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!items) return <p className="muted">Loading...</p>;
  if (items.length === 0) {
    return <p className="empty">{isFarmer ? "Abhi tak koi buy request nahi aayi." : "Aapne abhi tak koi buy request nahi bheji."}</p>;
  }

  return (
    <div className="stack">
      {items.map((r) => {
        const phone = isFarmer ? digits(r.contact_phone) : digits(r.farmer_phone);
        return (
          <article className="card list-item" key={r.id}>
            <div className="list-row">
              <span className="tag tag-crop">🌾 {r.crop}</span>
              <span className={`tag tag-status tag-${r.status}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            <h3>{r.quantity} {isFarmer ? `chahiye — ${r.consumer_name}` : `— ${r.farmer_name} se`}</h3>
            {r.message && <p className="message">{r.message}</p>}

            {isFarmer && <p><b>📞 Buyer:</b> {r.contact_phone}</p>}
            {!isFarmer && r.status === "accepted" && r.farmer_phone && <p><b>📞 Farmer:</b> {r.farmer_phone}</p>}

            {phone && (r.status === "accepted" || isFarmer) && (
              <div className="list-row action-row">
                <a className="btn btn-outline" href={`tel:+91${phone}`}>📞 Call</a>
                <a className="btn btn-outline" target="_blank" rel="noreferrer"
                   href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Namaste, ${r.crop} ke baare me baat karni thi (${r.quantity}).`)}`}>💬 WhatsApp</a>
              </div>
            )}

            <div className="list-row">
              <p className="muted small">{formatDate(r.created_at)}</p>
              {isFarmer && r.status === "pending" && (
                <div className="action-row">
                  <button className="btn btn-primary" onClick={() => respond(r.id, "accepted")}>Accept</button>
                  <button className="btn btn-outline" onClick={() => respond(r.id, "rejected")}>Reject</button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

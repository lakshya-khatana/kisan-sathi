import { useState } from "react";
import { api } from "../api.js";

export default function BuyRequestForm({ listing, onDone, onCancel }) {
  const [form, setForm] = useState({ quantity: "", contact_phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/produce/${listing.id}/request/`, form);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form buy-form" onSubmit={submit}>
      <label>Kitna chahiye?
        <input value={form.quantity} onChange={set("quantity")} maxLength={40} required
               placeholder={`e.g. 20 Kg (available: ${listing.quantity})`} />
      </label>
      <label>Aapka phone number
        <input value={form.contact_phone} onChange={set("contact_phone")} maxLength={20} required
               inputMode="tel" placeholder="10-digit mobile number" />
        <span className="muted small">Farmer ko tabhi dikhega jab wo request dekhega.</span>
      </label>
      <label>Message <span className="muted small">(optional)</span>
        <textarea value={form.message} onChange={set("message")} maxLength={500} rows={2}
                  placeholder="Delivery, pickup time, etc." />
      </label>
      {error && <p className="error-text">{error}</p>}
      <div className="list-row">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send buy request"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

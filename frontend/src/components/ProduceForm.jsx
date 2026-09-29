import { useState } from "react";
import { api } from "../api.js";

const EMPTY = { crop: "", quantity: "", location: "", price: "", contact_phone: "", notes: "" };

export default function ProduceForm({ onPosted }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setDone(false); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/produce/", form);
      setForm(EMPTY);
      setDone(true);
      onPosted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>List your produce for sale</h2>
      <p className="muted small">Buyers looking for this crop will see your listing and can contact you directly.</p>
      <label>Crop
        <input value={form.crop} onChange={set("crop")} maxLength={80} required placeholder="e.g. Wheat" />
      </label>
      <label>Quantity available
        <input value={form.quantity} onChange={set("quantity")} maxLength={40} required placeholder="e.g. 5 quintal" />
      </label>
      <label>Your location
        <input value={form.location} onChange={set("location")} maxLength={120} required placeholder="e.g. Meerut, UP" />
      </label>
      <label>Price <span className="muted small">(optional)</span>
        <input value={form.price} onChange={set("price")} maxLength={60} placeholder="e.g. ₹22/kg" />
      </label>
      <label>Your phone number
        <input value={form.contact_phone} onChange={set("contact_phone")} maxLength={20} required
               placeholder="10-digit mobile number" inputMode="tel" />
        <span className="muted small">Shown to buyers so they can call you.</span>
      </label>
      <label>Notes <span className="muted small">(optional)</span>
        <textarea value={form.notes} onChange={set("notes")} maxLength={800} rows={3}
                  placeholder="Quality, harvest date, delivery, etc." />
      </label>
      {error && <p className="error-text">{error}</p>}
      {done && <p className="success-text">Listed! Buyers looking for this crop can see it now.</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Posting..." : "List for sale"}</button>
    </form>
  );
}

import { useState } from "react";
import { api } from "../api.js";

const EMPTY = { crop: "", quantity: "", location: "", budget: "", contact_phone: "", notes: "" };

export default function DemandForm({ onPosted }) {
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
      await api.post("/demands/", form);
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
      <h2>Tell farmers what you need</h2>
      <p className="muted small">Post your requirement and any nearby farmer with this crop can contact you directly.</p>
      <label>Crop
        <input value={form.crop} onChange={set("crop")} maxLength={80} required placeholder="e.g. Tomato" />
      </label>
      <label>Quantity needed
        <input value={form.quantity} onChange={set("quantity")} maxLength={40} required placeholder="e.g. 50 kg" />
      </label>
      <label>Your location
        <input value={form.location} onChange={set("location")} maxLength={120} required placeholder="e.g. Meerut, UP" />
      </label>
      <label>Budget <span className="muted small">(optional)</span>
        <input value={form.budget} onChange={set("budget")} maxLength={60} placeholder="e.g. ₹20/kg" />
      </label>
      <label>Your phone number
        <input value={form.contact_phone} onChange={set("contact_phone")} maxLength={20} required
               placeholder="10-digit mobile number" inputMode="tel" />
        <span className="muted small">Shown to farmers so they can call you.</span>
      </label>
      <label>Notes <span className="muted small">(optional)</span>
        <textarea value={form.notes} onChange={set("notes")} maxLength={800} rows={3}
                  placeholder="Quality, delivery preference, when you need it by, etc." />
      </label>
      {error && <p className="error-text">{error}</p>}
      {done && <p className="success-text">Posted! Farmers growing this crop can see it now.</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Posting..." : "Post my requirement"}</button>
    </form>
  );
}

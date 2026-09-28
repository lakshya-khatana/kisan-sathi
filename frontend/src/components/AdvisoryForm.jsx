import { useState } from "react";
import { api } from "../api.js";
import { CATEGORIES } from "../constants.js";

const EMPTY = { title: "", category: "scheme", crop: "", message: "" };

export default function AdvisoryForm({ onPosted }) {
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
      await api.post("/advisories/", form);
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
      <h2>Send information to farmers</h2>
      <label>Type
        <select value={form.category} onChange={set("category")}>
          {Object.entries(CATEGORIES).map(([key, c]) => <option key={key} value={key}>{c.icon} {c.label}</option>)}
        </select>
      </label>
      <label>Title
        <input value={form.title} onChange={set("title")} maxLength={120} required placeholder="e.g. PM-KISAN next instalment" />
      </label>
      <label>Crop <span className="muted small">(optional — leave empty for all crops)</span>
        <input value={form.crop} onChange={set("crop")} maxLength={60} placeholder="e.g. Tomato" />
      </label>
      <label>Message
        <textarea value={form.message} onChange={set("message")} maxLength={2000} rows={6} required
                  placeholder="Explain the benefit, who is eligible, and how to apply." />
        <span className="muted small">{form.message.length}/2000</span>
      </label>
      {error && <p className="error-text">{error}</p>}
      {done && <p className="success-text">Posted! Farmers can see it now.</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Posting..." : "Post to farmers"}</button>
    </form>
  );
}

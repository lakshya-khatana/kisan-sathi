import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api.post("/auth/forgot/", { email });
      setMsg(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="card auth-card">
        <h2>Forgot password?</h2>
        <p className="muted">Enter your registered email. We will send you a link to set a new password.</p>
        {msg ? <p className="notice">{msg} Check your inbox (and spam folder).</p> : (
          <form onSubmit={submit} className="form">
            <label>Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
          </form>
        )}
        <p className="switch-mode"><Link to="/login">Back to login</Link></p>
      </div>
    </section>
  );
}

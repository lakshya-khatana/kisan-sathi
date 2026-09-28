import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const uid = params.get("uid"), token = params.get("token");

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/reset/", { uid, token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="card auth-card">
        <h2>Set a new password</h2>
        {done ? (
          <>
            <p className="notice">Password changed successfully.</p>
            <Link className="btn btn-primary btn-block" to="/login">Log in</Link>
          </>
        ) : !uid || !token ? (
          <p className="error-text">This link is incomplete. <Link to="/forgot-password">Request a new one</Link>.</p>
        ) : (
          <form onSubmit={submit} className="form">
            <label>New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            </label>
            {error && <p className="error-text">{error} <Link to="/forgot-password">Request a new link</Link></p>}
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving..." : "Change password"}</button>
          </form>
        )}
      </div>
    </section>
  );
}

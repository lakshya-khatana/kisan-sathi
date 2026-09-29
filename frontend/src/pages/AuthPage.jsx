import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const ROLE_INFO = {
  farmer: { title: "Farmer", icon: "🧑‍🌾", blurb: "Scan diseased leaves, read benefits shared by experts, and sell your produce directly to buyers." },
  consumer: { title: "Consumer", icon: "🛒", blurb: "Tell farmers what crops you need, and buy fresh produce directly from them." },
  expert: { title: "Expert", icon: "🎓", blurb: "Share schemes, benefits and alerts with farmers." },
};
const ROLE_KEYS = Object.keys(ROLE_INFO);

export default function AuthPage() {
  const [params] = useSearchParams();
  const { user, login, register, logout } = useAuth();
  const [role, setRole] = useState(ROLE_KEYS.includes(params.get("role")) ? params.get("role") : "farmer");
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", access_code: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // If someone was ALREADY logged in when this page opened and they clicked the other
  // role's button on the landing page (e.g. an expert clicking "I'm a Farmer"), log them
  // out once so they can sign in / register as that role. This only applies to the
  // state at page load - after a fresh login/register here we go straight to the dashboard.
  const wasLoggedIn = useRef(Boolean(user));
  const wantedRole = params.get("role");
  const switching = wasLoggedIn.current && Boolean(user) && Boolean(wantedRole) && wantedRole !== user.role;
  useEffect(() => {
    if (switching) { wasLoggedIn.current = false; logout(); }
  }, [switching]); // eslint-disable-line react-hooks/exhaustive-deps

  if (switching) return null;
  if (user) return <Navigate to={`/${user.role}`} replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body = { email: form.email, password: form.password, role };
      if (mode === "register") {
        body.name = form.name;
        if (role === "expert") body.access_code = form.access_code;
      }
      await (mode === "login" ? login(body) : register(body));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="card auth-card">
        <div className="role-tabs">
          {Object.entries(ROLE_INFO).map(([key, info]) => (
            <button
              key={key} type="button"
              className={`role-tab ${role === key ? "active" : ""}`}
              onClick={() => { setRole(key); setError(null); }}
            >
              {info.icon} {info.title}
            </button>
          ))}
        </div>

        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">{ROLE_INFO[role].blurb}</p>

        <form onSubmit={submit} className="form">
          {mode === "register" && (
            <label>Full name
              <input value={form.name} onChange={set("name")} required autoComplete="name" />
            </label>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={set("password")} required minLength={6}
                   autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          {mode === "register" && role === "expert" && (
            <label>Expert access code
              <input value={form.access_code} onChange={set("access_code")} required />
              <span className="muted small">Ask the project admin for the code. It keeps random visitors from posting to farmers.</span>
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          {mode === "login" && <p className="small"><Link to="/forgot-password">Forgot password?</Link></p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? `Log in as ${ROLE_INFO[role].title}` : `Register as ${ROLE_INFO[role].title}`}
          </button>
        </form>

        <p className="switch-mode">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" className="link-btn" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </section>
  );
}

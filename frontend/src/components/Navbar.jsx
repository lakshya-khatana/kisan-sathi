import { Link, useNavigate } from "react-router-dom";
import { SITE_NAME } from "../constants.js";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">🌾 {SITE_NAME}</Link>
      <nav className="nav-actions">
        {user ? (
          <>
            <span className="user-chip">{user.name} · {user.role}</span>
            <Link className="btn btn-ghost" to={`/${user.role}`}>Dashboard</Link>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login?role=expert">Expert login</Link>
            <Link className="btn btn-primary" to="/login?role=farmer">Farmer login</Link>
          </>
        )}
      </nav>
    </header>
  );
}

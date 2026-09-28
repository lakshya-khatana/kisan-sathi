import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={`/login?role=${role}`} replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

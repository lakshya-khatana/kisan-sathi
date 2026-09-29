import { SITE_NAME } from "./constants.js";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Protected from "./components/Protected.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import ExpertDashboard from "./pages/ExpertDashboard.jsx";
import ConsumerDashboard from "./pages/ConsumerDashboard.jsx";

export default function App() {
  return (
    <div className="site">
      <Navbar />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/farmer" element={<Protected role="farmer"><FarmerDashboard /></Protected>} />
          <Route path="/expert" element={<Protected role="expert"><ExpertDashboard /></Protected>} />
          <Route path="/consumer" element={<Protected role="consumer"><ConsumerDashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>{SITE_NAME} · Kisan ka digital saathi</p>
        <p className="muted">Treatment text is general guidance. Consult a local agriculture officer for serious outbreaks.</p>
      </footer>
    </div>
  );
}

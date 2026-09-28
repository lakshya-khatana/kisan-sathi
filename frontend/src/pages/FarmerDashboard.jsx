import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import Tabs from "../components/Tabs.jsx";
import ScanPanel from "../components/ScanPanel.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import AdvisoryFeed from "../components/AdvisoryFeed.jsx";

const TABS = [
  { id: "scan", label: "📸 Scan leaf" },
  { id: "history", label: "🗂️ My scans" },
  { id: "advice", label: "🏛️ Expert updates" },
];

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("scan");
  const [scanCount, setScanCount] = useState(0);

  return (
    <section className="dashboard">
      <h1>Namaste, {user.name} 👋</h1>
      <p className="muted">Check your crops for disease and read the latest benefits from agriculture experts.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="panel">
        {tab === "scan" && <ScanPanel onScanned={() => setScanCount((n) => n + 1)} />}
        {tab === "history" && <HistoryPanel refreshKey={scanCount} />}
        {tab === "advice" && <AdvisoryFeed />}
      </div>
    </section>
  );
}

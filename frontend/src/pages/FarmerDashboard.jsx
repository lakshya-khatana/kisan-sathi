import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import Tabs from "../components/Tabs.jsx";
import ScanPanel from "../components/ScanPanel.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import AdvisoryFeed from "../components/AdvisoryFeed.jsx";
import DemandFeed from "../components/DemandFeed.jsx";
import ProduceForm from "../components/ProduceForm.jsx";
import ProduceFeed from "../components/ProduceFeed.jsx";
import BuyRequestList from "../components/BuyRequestList.jsx";

const TABS = [
  { id: "scan", label: "📸 Scan leaf" },
  { id: "history", label: "🗂️ My scans" },
  { id: "advice", label: "🏛️ Expert updates" },
  { id: "buyers", label: "🛒 Buyer demand" },
  { id: "sell", label: "📦 Sell produce" },
  { id: "orders", label: "📥 Buy requests" },
];

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("scan");
  const [scanCount, setScanCount] = useState(0);
  const [listingCount, setListingCount] = useState(0);

  return (
    <section className="dashboard">
      <h1>Namaste, {user.name} 👋</h1>
      <p className="muted">Check your crops for disease, read the latest benefits from experts, and sell your produce directly to buyers.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="panel">
        {tab === "scan" && <ScanPanel onScanned={() => setScanCount((n) => n + 1)} />}
        {tab === "history" && <HistoryPanel refreshKey={scanCount} />}
        {tab === "advice" && <AdvisoryFeed />}
        {tab === "buyers" && (
          <div className="stack">
            <p className="muted small">Crops buyers are looking for right now — grow or sell what's in demand.</p>
            <DemandFeed />
          </div>
        )}
        {tab === "orders" && (
          <div className="stack">
            <p className="muted small">Buyers ki requests — accept karo to buyer ko aapka number dikhega. Payment aap dono aapas me tay karo.</p>
            <BuyRequestList role="farmer" />
          </div>
        )}
        {tab === "sell" && (
          <div className="stack">
            <ProduceForm onPosted={() => setListingCount((n) => n + 1)} />
            <h2>My listings</h2>
            <ProduceFeed mine refreshKey={listingCount} />
          </div>
        )}
      </div>
    </section>
  );
}

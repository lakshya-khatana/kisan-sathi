import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import Tabs from "../components/Tabs.jsx";
import DemandForm from "../components/DemandForm.jsx";
import DemandFeed from "../components/DemandFeed.jsx";
import ProduceFeed from "../components/ProduceFeed.jsx";

const TABS = [
  { id: "post", label: "📢 Post a need" },
  { id: "mine", label: "🗂️ My requests" },
  { id: "browse", label: "🧺 Browse produce" },
];

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("post");
  const [postCount, setPostCount] = useState(0);

  return (
    <section className="dashboard">
      <h1>Namaste, {user.name} 🛒</h1>
      <p className="muted">Tell farmers what crops you need, or browse produce that's ready to buy right now.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="panel">
        {tab === "post" && <DemandForm onPosted={() => setPostCount((n) => n + 1)} />}
        {tab === "mine" && <DemandFeed mine refreshKey={postCount} />}
        {tab === "browse" && <ProduceFeed />}
      </div>
    </section>
  );
}

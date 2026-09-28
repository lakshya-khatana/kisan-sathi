import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import Tabs from "../components/Tabs.jsx";
import AdvisoryForm from "../components/AdvisoryForm.jsx";
import AdvisoryFeed from "../components/AdvisoryFeed.jsx";

const TABS = [
  { id: "post", label: "✍️ New post" },
  { id: "mine", label: "🗂️ My posts" },
];

export default function ExpertDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("post");
  const [postCount, setPostCount] = useState(0);

  return (
    <section className="dashboard">
      <h1>Welcome, {user.name} 🎓</h1>
      <p className="muted">Share schemes, benefits, tips and disease alerts. Every farmer can read what you post.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="panel">
        {tab === "post" && <AdvisoryForm onPosted={() => setPostCount((n) => n + 1)} />}
        {tab === "mine" && <AdvisoryFeed mine refreshKey={postCount} />}
      </div>
    </section>
  );
}

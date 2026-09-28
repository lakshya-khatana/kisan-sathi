import { Link } from "react-router-dom";

function FieldArt() {
  return (
    <svg className="hero-art" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="1000" cy="190" r="74" fill="#ffd45e" opacity="0.28" />
      <circle cx="1000" cy="190" r="46" fill="#ffd45e" />
      <path d="M0 240 C200 180 380 200 560 232 C760 268 950 190 1200 228 L1200 360 L0 360Z" fill="#8bc34a" />
      <path d="M0 285 C250 232 450 296 700 270 C900 250 1050 286 1200 264 L1200 360 L0 360Z" fill="#558b2f" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M0 ${306 + i * 10} C300 ${286 + i * 10} 800 ${326 + i * 10} 1200 ${300 + i * 10}`}
          stroke="#33691e" strokeWidth="3" fill="none" opacity="0.5"
        />
      ))}
    </svg>
  );
}

const FEATURES = [
  { icon: "📸", title: "Snap a leaf photo", text: "Upload a picture of an affected leaf from your phone or computer. No technical knowledge needed." },
  { icon: "🔬", title: "Instant disease detection", text: "A deep-learning model trained on 38 crop-disease classes names the problem and shows how confident it is." },
  { icon: "💊", title: "Clear treatment advice", text: "Get practical steps to control the disease, with a severity rating so you know how urgent it is." },
  { icon: "🏛️", title: "Benefits from experts", text: "Agriculture experts share government schemes, seasonal tips and disease alerts right in your dashboard." },
];

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">KISAN SATHI · AI for healthier crops</p>
          <h1>Spot crop diseases early.<br />Protect your harvest.</h1>
          <p className="hero-sub">
            Upload a photo of a diseased leaf and get the disease name and treatment in seconds —
            plus schemes, tips and alerts from agriculture experts.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/login?role=farmer&mode=register">I'm a Farmer — get started</Link>
            <Link className="btn btn-outline btn-lg" to="/login?role=expert">I'm an Expert</Link>
          </div>
        </div>
        <FieldArt />
      </section>

      <section className="section">
        <h2 className="section-title">Everything a farmer needs in one place</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="card feature" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step"><span>1</span><p><b>Create a free account</b> as a Farmer or an Expert.</p></div>
          <div className="step"><span>2</span><p><b>Farmers</b> upload a leaf photo and get the diagnosis and treatment.</p></div>
          <div className="step"><span>3</span><p><b>Experts</b> post schemes, benefits and alerts that every farmer can read.</p></div>
        </div>
      </section>
    </>
  );
}

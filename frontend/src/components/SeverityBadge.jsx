const COLORS = {
  none: "#2e7d32", low: "#558b2f", moderate: "#f9a825",
  high: "#ef6c00", critical: "#c62828", unknown: "#616161",
};

export default function SeverityBadge({ severity }) {
  return (
    <span className="severity-badge" style={{ backgroundColor: COLORS[severity] || COLORS.unknown }}>
      {(severity || "unknown").toUpperCase()}
    </span>
  );
}

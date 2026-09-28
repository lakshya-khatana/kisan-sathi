export const CATEGORIES = {
  scheme: { label: "Scheme / Benefit", icon: "🏛️" },
  tip: { label: "Farming Tip", icon: "🌱" },
  alert: { label: "Alert", icon: "⚠️" },
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const SITE_NAME = "KISAN SATHI";

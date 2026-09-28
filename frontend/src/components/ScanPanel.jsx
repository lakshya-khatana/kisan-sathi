import { useState } from "react";
import { api } from "../api.js";
import ImageUpload from "./ImageUpload.jsx";
import ResultCard from "./ResultCard.jsx";

export default function ScanPanel({ onScanned }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [crop, setCrop] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    form.append("image", file);
    form.append("crop", crop);
    form.append("language", language);
    try {
      setResult(await api.upload("/predict/", form));
      onScanned?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <ImageUpload onImageSelected={setFile} disabled={loading} />
      <div className="form">
        <label>Crop name (optional)
          <input value={crop} onChange={(e) => setCrop(e.target.value)} maxLength={60} placeholder="e.g. Tomato, Wheat, Potato" />
        </label>
        <label>Result language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="hinglish">Hinglish</option>
            <option value="hindi">हिन्दी</option>
            <option value="english">English</option>
          </select>
        </label>
      </div>
      <button className="btn btn-primary btn-block" onClick={analyze} disabled={!file || loading}>
        {loading ? "Analyzing... (this can take up to a minute)" : "Analyze leaf"}
      </button>
      {error && <p className="error-text">{error}</p>}
      <ResultCard result={result} />
    </div>
  );
}

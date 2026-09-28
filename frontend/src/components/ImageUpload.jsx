import { useCallback, useRef, useState } from "react";

export default function ImageUpload({ onImageSelected, disabled }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    onImageSelected(file);
  }, [onImageSelected]);

  return (
    <div
      className={`upload-zone ${dragActive ? "drag-active" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef} type="file" hidden disabled={disabled}
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {preview ? (
        <img src={preview} alt="Selected leaf" className="preview-img" />
      ) : (
        <div className="upload-placeholder">
          <span className="upload-icon">🌿</span>
          <p>Drag &amp; drop a leaf photo here, or click to browse</p>
          <p className="muted small">JPEG, PNG or WebP, up to 8 MB. Use a clear, close photo of one leaf.</p>
        </div>
      )}
    </div>
  );
}

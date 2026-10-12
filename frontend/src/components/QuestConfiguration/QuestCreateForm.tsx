import React, { useMemo, useRef, useState } from "react";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { uploadMediaFile } from "../../services/api/mediaApi";
import { logger } from "../../utils/logger";
import "./StepForm.css";

interface QuestCreateFormProps {
  onBack: () => void;
  onClose: () => void;
  onCreated: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

interface ImageUploadFieldProps {
  label: string;
  required?: boolean;
  accept: string;
  previewUrl: string;
  fileSize: number | null;
  isDragOver: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
  onDragOver: (over: boolean) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  required,
  accept,
  previewUrl,
  fileSize,
  isDragOver,
  onFile,
  onClear,
  onDragOver,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="step-form__field">
      <label className={`step-form__label${required ? " step-form__label-required" : ""}`}>{label}</label>
      <div
        className={`step-form__upload${isDragOver ? " step-form__upload--dragover" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(true);
        }}
        onDragLeave={() => onDragOver(false)}
        onDrop={handleDrop}
      >
        <svg className="step-form__upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="step-form__upload-text">Choose image or drag &amp; drop it here.</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </div>
      {previewUrl && (
        <div className="step-form__preview">
          <img src={previewUrl} alt="" />
          <button type="button" className="step-form__preview-remove" onClick={onClear} aria-label="Remove image">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {fileSize !== null && (
            <span className="step-form__preview-size">{formatFileSize(fileSize)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const QuestCreateForm: React.FC<QuestCreateFormProps> = ({ onBack, onClose, onCreated }) => {
  const { createQuest, isSubmitting } = useApiQuestContext();

  const [themeName, setThemeName] = useState("");
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [backgroundFileSize, setBackgroundFileSize] = useState<number | null>(null);
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapPreview, setMapPreview] = useState("");
  const [mapFileSize, setMapFileSize] = useState<number | null>(null);
  const [backgroundDragOver, setBackgroundDragOver] = useState(false);
  const [mapDragOver, setMapDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const readFile = (file: File, onPreview: (url: string) => void, onSize: (size: number) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onPreview(e.target?.result as string);
      onSize(file.size);
    };
    reader.onerror = () => alert("Failed to load file");
    reader.readAsDataURL(file);
  };

  const handleBackgroundFile = (file: File) => {
    setBackgroundFile(file);
    readFile(file, setBackgroundPreview, setBackgroundFileSize);
  };

  const handleMapFile = (file: File) => {
    setMapFile(file);
    readFile(file, setMapPreview, setMapFileSize);
  };

  const canSave = useMemo(() => {
    if (isSubmitting || isSaving) return false;
    if (!themeName.trim() || themeName.trim().length < 3) return false;
    if (!backgroundFile && !backgroundPreview) return false;
    if (!mapFile && !mapPreview) return false;
    return true;
  }, [isSubmitting, isSaving, themeName, backgroundFile, backgroundPreview, mapFile, mapPreview]);

  const handleSave = async () => {
    if (!themeName.trim()) {
      alert("Please enter a theme name");
      return;
    }
    if (themeName.trim().length < 3) {
      alert("Theme name must be at least 3 characters.");
      return;
    }
    if (!backgroundFile) {
      alert("Please upload a background image");
      return;
    }
    if (!mapFile) {
      alert("Please upload a map SVG");
      return;
    }

    setIsSaving(true);
    try {
      const backgroundMedia = await uploadMediaFile(backgroundFile, "Quest background");
      const mapMedia = await uploadMediaFile(mapFile, "Quest map");
      const err = await createQuest({
        name: themeName.trim(),
        backgroundMediaId: backgroundMedia.id,
        mapMediaId: mapMedia.id,
      });
      if (err !== null) {
        alert(err);
        return;
      }
      onCreated();
    } catch (err) {
      logger.error("QuestCreateForm", "Failed to create quest:", err);
      alert(`Failed to create quest: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="step-form">
      <header className="step-form__header">
        <button type="button" className="step-form__back" onClick={onBack} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="step-form__title">Quest</h2>
        <button type="button" className="step-form__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="step-form__body">
        <section className="step-form__section">
          <h3 className="step-form__section-title">General</h3>
          <div className="step-form__field">
            <label className="step-form__label step-form__label-required" htmlFor="quest-theme-name">
              Theme name
            </label>
            <input
              id="quest-theme-name"
              type="text"
              className="step-form__input step-form__input--text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder='e.g. "My Custom Quest"'
            />
          </div>
        </section>

        <section className="step-form__section">
          <h3 className="step-form__section-title">Image</h3>
          <ImageUploadField
            label="Background image"
            required
            accept="image/*,.svg"
            previewUrl={backgroundPreview}
            fileSize={backgroundFileSize}
            isDragOver={backgroundDragOver}
            onFile={handleBackgroundFile}
            onClear={() => {
              setBackgroundFile(null);
              setBackgroundPreview("");
              setBackgroundFileSize(null);
            }}
            onDragOver={setBackgroundDragOver}
          />
          <ImageUploadField
            label="Map SVG"
            required
            accept=".svg,image/svg+xml"
            previewUrl={mapPreview}
            fileSize={mapFileSize}
            isDragOver={mapDragOver}
            onFile={handleMapFile}
            onClear={() => {
              setMapFile(null);
              setMapPreview("");
              setMapFileSize(null);
            }}
            onDragOver={setMapDragOver}
          />
        </section>
      </div>

      <footer className="step-form__footer">
        <button type="button" className="quest-config__btn quest-config__btn--cancel" onClick={onBack}>
          Cancel
        </button>
        <button
          type="button"
          className="quest-config__btn quest-config__btn--save"
          onClick={() => void handleSave()}
          disabled={!canSave}
        >
          {isSaving || isSubmitting ? "Saving..." : "Save quest"}
        </button>
      </footer>
    </div>
  );
};

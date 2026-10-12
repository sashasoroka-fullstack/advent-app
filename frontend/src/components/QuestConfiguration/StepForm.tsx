import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { useStepEditing } from "../../context/StepEditingContext";
import { useUIConfig } from "../../context/UIConfigContext";
import { resolveStepIconMediaIdForCreate, resolveStepIconMediaIdForUpdate } from "../../utils/questStepMedia";
import type { CreateApiQuestStepPayload, UpdateApiQuestStepPayload } from "../../services/api/questsApi";
import { UIStepConfig } from "../../services/uiConfigSchema";
import { saveConfigEdits } from "../../utils/localStorageConfig";
import "./StepForm.css";

const DEFAULT_COLOR = "#EF4444";
const DEFAULT_ICON = "/assets/icons/planet-base.svg";

type IconMode = "default" | "custom";

export interface StepFormProps {
  mode: "create" | "edit";
  editIndex?: number;
  onBack: () => void;
  onClose: () => void;
}

function parseSizePx(size?: string): number {
  if (!size) return 0;
  const pxMatch = size.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

function formatSizePx(value: number): string | undefined {
  if (!value || value <= 0) return undefined;
  return `${value}px`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

const NumberField: React.FC<{
  label: string;
  required?: boolean;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}> = ({ label, required, value, onChange, step = 1 }) => (
  <div className="step-form__field">
    <label className={`step-form__label${required ? " step-form__label-required" : ""}`}>{label}</label>
    <input
      type="number"
      className="step-form__input step-form__input--text"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        onChange(Number.isNaN(parsed) ? 0 : parsed);
      }}
    />
  </div>
);

export const StepForm: React.FC<StepFormProps> = ({ mode, editIndex, onBack, onClose }) => {
  const { uiConfigRaw, configKey: currentUITheme, applyConfig } = useUIConfig();
  const {
    selectedQuestId,
    activeLocalConfigKey,
    selectedQuest,
    createQuestStep,
    updateQuestStep,
    isSubmitting,
  } = useApiQuestContext();
  const {
    editingStepPosition,
    setEditingStepIndex,
    setEditingStepPosition,
    setOnStepPositionUpdate,
    setCreatingStep,
    creatingStepPosition,
    setCreatingStepPosition,
  } = useStepEditing();

  const apiStepsMode = selectedQuestId !== null && activeLocalConfigKey === null;
  const localQuestKey = activeLocalConfigKey || currentUITheme || "";
  const steps = uiConfigRaw?.steps ?? [];

  const getNextAvailableTaskNumber = useCallback((): number => {
    if (steps.length === 0) return 0;
    const existingNumbers = new Set(steps.map((s) => s.taskNumber));
    const maxNumber = Math.max(...steps.map((s) => s.taskNumber));
    for (let i = 0; i <= maxNumber; i++) {
      if (!existingNumbers.has(i)) return i;
    }
    return maxNumber + 1;
  }, [steps]);

  const sourceStep = mode === "edit" && editIndex !== undefined ? steps[editIndex] : null;

  const [taskNumber, setTaskNumber] = useState(() =>
    mode === "edit" && sourceStep ? sourceStep.taskNumber : getNextAvailableTaskNumber(),
  );
  const [label, setLabel] = useState(() => sourceStep?.label ?? "");
  const [sizePx, setSizePx] = useState(() => parseSizePx(sourceStep?.size));
  const [cxStep, setCxStep] = useState(() => sourceStep?.cxStep ?? 0);
  const [cyStep, setCyStep] = useState(() => sourceStep?.cyStep ?? 0);
  const [iconMode, setIconMode] = useState<IconMode>(() =>
    sourceStep?.color ? "default" : sourceStep?.icon && sourceStep.icon !== DEFAULT_ICON ? "custom" : "default",
  );
  const [color, setColor] = useState(() => sourceStep?.color ?? DEFAULT_COLOR);
  const [customIcon, setCustomIcon] = useState(() =>
    sourceStep?.icon && !sourceStep.color ? sourceStep.icon : "",
  );
  const [iconFileSize, setIconFileSize] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const initialPositionRef = useRef<{ cxStep: number; cyStep: number } | null>(
    sourceStep ? { cxStep: sourceStep.cxStep, cyStep: sourceStep.cyStep } : null,
  );

  useEffect(() => {
    if (mode === "create") {
      const next = getNextAvailableTaskNumber();
      setTaskNumber(next);
      setCreatingStep({
        taskNumber: next,
        label: "",
        cxStep: 0,
        cyStep: 0,
        color: DEFAULT_COLOR,
        size: undefined,
      });
      setCreatingStepPosition({ cxStep: 0, cyStep: 0 });
    } else if (editIndex !== undefined) {
      setEditingStepIndex(editIndex);
      setEditingStepPosition({ cxStep, cyStep });
      setOnStepPositionUpdate((index: number, newCx: number, newCy: number) => {
        if (index === editIndex) {
          setCxStep(newCx);
          setCyStep(newCy);
        }
      });
    }
    return () => {
      if (mode === "create") {
        setCreatingStep(null);
        setCreatingStepPosition(null);
      } else {
        setEditingStepIndex(null);
        setEditingStepPosition(null);
        setOnStepPositionUpdate(null);
      }
    };
  }, [mode, editIndex]);

  useEffect(() => {
    if (mode === "edit" && editingStepPosition) {
      setCxStep(editingStepPosition.cxStep);
      setCyStep(editingStepPosition.cyStep);
    }
  }, [mode, editingStepPosition]);

  useEffect(() => {
    if (mode === "create" && creatingStepPosition) {
      setCxStep(creatingStepPosition.cxStep);
      setCyStep(creatingStepPosition.cyStep);
    }
  }, [mode, creatingStepPosition]);

  const syncCreatingStep = useCallback(
    (patch: Partial<UIStepConfig>) => {
      if (mode !== "create") return;
      setCreatingStep({
        taskNumber,
        label: label || undefined,
        cxStep,
        cyStep,
        color: iconMode === "default" ? color : undefined,
        icon: iconMode === "custom" ? customIcon || DEFAULT_ICON : DEFAULT_ICON,
        size: formatSizePx(sizePx),
        ...patch,
      });
    },
    [mode, taskNumber, label, cxStep, cyStep, iconMode, color, customIcon, sizePx, setCreatingStep],
  );

  useEffect(() => {
    syncCreatingStep({});
  }, [taskNumber, label, cxStep, cyStep, iconMode, color, customIcon, sizePx]);

  const openColorPicker = () => {
    colorInputRef.current?.click();
  };

  const updatePosition = (newCx: number, newCy: number) => {
    setCxStep(newCx);
    setCyStep(newCy);
    if (mode === "create") {
      setCreatingStepPosition({ cxStep: newCx, cyStep: newCy });
    } else if (editIndex !== undefined) {
      setEditingStepPosition({ cxStep: newCx, cyStep: newCy });
    }
  };

  const handleIconFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomIcon(dataUrl);
      setIconFileSize(file.size);
    };
    reader.onerror = () => alert("Failed to load icon file");
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    if (mode === "edit" && initialPositionRef.current) {
      setEditingStepPosition(initialPositionRef.current);
    }
    onBack();
  };

  const handleClose = () => {
    if (mode === "edit" && initialPositionRef.current) {
      setEditingStepPosition(initialPositionRef.current);
    }
    onClose();
  };

  const persistLocalSteps = (newSteps: UIStepConfig[]) => {
    if (!uiConfigRaw) return;
    const updatedConfig = { ...uiConfigRaw, steps: newSteps };
    if (localQuestKey) {
      saveConfigEdits(localQuestKey, updatedConfig);
    }
    applyConfig(updatedConfig);
  };

  const buildStepConfig = (): UIStepConfig => ({
    taskNumber,
    label: label.trim() || undefined,
    cxStep,
    cyStep,
    icon: iconMode === "default" ? DEFAULT_ICON : customIcon || DEFAULT_ICON,
    color: iconMode === "default" ? color : undefined,
    size: formatSizePx(sizePx),
    apiStepId: sourceStep?.apiStepId,
  });

  const handleSave = async () => {
    const sizeValue = formatSizePx(sizePx) || "5%";

    if (mode === "create") {
      if (iconMode === "custom" && !customIcon) {
        alert("Please upload a custom icon");
        return;
      }

      if (apiStepsMode) {
        const hasColor = iconMode === "default";
        const iconForResolve = hasColor ? "" : customIcon || DEFAULT_ICON;
        const iconMediaId = hasColor
          ? undefined
          : await resolveStepIconMediaIdForCreate(iconForResolve, false);
        const payload: CreateApiQuestStepPayload = {
          taskNumber,
          cxStep,
          cyStep,
          size: sizeValue,
        };
        const labelTrim = label.trim();
        if (labelTrim) payload.label = labelTrim;
        if (hasColor) payload.color = color;
        if (!hasColor && iconMediaId) payload.iconMediaId = iconMediaId;
        const err = await createQuestStep(payload);
        if (err) {
          alert(err);
          return;
        }
      } else {
        const step = buildStepConfig();
        persistLocalSteps([...steps, step].sort((a, b) => a.taskNumber - b.taskNumber));
      }
      setCreatingStep(null);
      setCreatingStepPosition(null);
      onBack();
      return;
    }

    if (editIndex === undefined || !sourceStep) return;

    const finalStep = buildStepConfig();

    if (apiStepsMode) {
      const stepId =
        sourceStep.apiStepId ??
        selectedQuest?.steps?.find((s) => s.taskNumber === sourceStep.taskNumber)?.id;
      if (stepId === undefined) {
        alert("Cannot update step: missing server step id. Reload the quest and try again.");
        return;
      }
      const patched: UpdateApiQuestStepPayload = {
        taskNumber: finalStep.taskNumber,
        cxStep: finalStep.cxStep,
        cyStep: finalStep.cyStep,
        label: finalStep.label?.trim() ? finalStep.label.trim() : null,
        color: iconMode === "default" ? color : null,
      };
      if (sizeValue) patched.size = sizeValue;
      const iconResolved = await resolveStepIconMediaIdForUpdate(
        finalStep.icon,
        sourceStep.icon,
        iconMode === "default",
      );
      if (iconResolved !== undefined) patched.iconMediaId = iconResolved;
      const err = await updateQuestStep(stepId, patched);
      if (err) {
        alert(err);
        return;
      }
    } else {
      const newSteps = [...steps];
      newSteps[editIndex] = finalStep;
      persistLocalSteps(newSteps.sort((a, b) => a.taskNumber - b.taskNumber));
    }

    flushSync(() => {
      setEditingStepIndex(null);
      setEditingStepPosition(null);
      setOnStepPositionUpdate(null);
    });
    onBack();
  };

  const canSave = useMemo(() => {
    if (isSubmitting) return false;
    if (iconMode === "custom" && !customIcon) return false;
    return true;
  }, [isSubmitting, iconMode, customIcon]);

  return (
    <div className="step-form">
      <header className="step-form__header">
        <button type="button" className="step-form__back" onClick={handleCancel} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="step-form__title">Step</h2>
        <button type="button" className="step-form__close" onClick={handleClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="step-form__body">
        <section className="step-form__section">
          <h3 className="step-form__section-title">General</h3>
          <div className="step-form__row">
            <NumberField label="Step number" required value={taskNumber} onChange={setTaskNumber} />
            <div className="step-form__field">
              <label className="step-form__label">Label</label>
              <input
                type="text"
                className="step-form__input step-form__input--text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={'e.g. "Final", "Start"'}
              />
            </div>
          </div>
          <NumberField label="Size (px)" value={sizePx} onChange={setSizePx} />
        </section>

        <section className="step-form__section">
          <h3 className="step-form__section-title">Position on map</h3>
          <div className="step-form__row">
            <NumberField label="X (%)" required value={cxStep} onChange={(v) => updatePosition(v, cyStep)} step={0.1} />
            <NumberField label="Y (%)" required value={cyStep} onChange={(v) => updatePosition(cxStep, v)} step={0.1} />
          </div>
        </section>

        <section className="step-form__section">
          <h3 className="step-form__section-title">Icon</h3>
          <div className="step-form__icon-toggle">
            <button
              type="button"
              className={`step-form__icon-toggle-btn${iconMode === "default" ? " step-form__icon-toggle-btn--active" : ""}`}
              onClick={() => setIconMode("default")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
              </svg>
              Default
            </button>
            <button
              type="button"
              className={`step-form__icon-toggle-btn${iconMode === "custom" ? " step-form__icon-toggle-btn--active" : ""}`}
              onClick={() => setIconMode("custom")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="7" r="1.5" fill="currentColor" />
                <path d="M2 11L5.5 7.5L8 10L11 7L14 10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              Custom icon
            </button>
          </div>

          {iconMode === "default" ? (
            <div className="step-form__field">
              <label className="step-form__label">Color</label>
              <div
                className="step-form__color-field"
                style={{ backgroundColor: color }}
                role="button"
                tabIndex={0}
                aria-label="Choose color"
                onClick={openColorPicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openColorPicker();
                  }
                }}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  className="step-form__color-input-hidden"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  tabIndex={-1}
                  aria-hidden
                />
                <span className="step-form__color-edit" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 1.5L12.5 4.5L5 12H2V9L9.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="step-form__field">
                <label className="step-form__label step-form__label-required">Custom icon</label>
                <div
                  className={`step-form__upload${isDragOver ? " step-form__upload--dragover" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleIconFile(file);
                  }}
                >
                  <svg className="step-form__upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="step-form__upload-text">Choose image or drag &amp; drop it here.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconFile(file);
                    }}
                  />
                </div>
              </div>
              {customIcon && (
                <div className="step-form__preview">
                  <img src={customIcon} alt="Icon preview" />
                  <button
                    type="button"
                    className="step-form__preview-remove"
                    onClick={() => {
                      setCustomIcon("");
                      setIconFileSize(null);
                    }}
                    aria-label="Remove icon"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {iconFileSize !== null && (
                    <span className="step-form__preview-size">{formatFileSize(iconFileSize)}</span>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="step-form__footer">
        <button type="button" className="quest-config__btn quest-config__btn--cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="quest-config__btn quest-config__btn--save"
          onClick={() => void handleSave()}
          disabled={!canSave}
        >
          Save step
        </button>
      </footer>
    </div>
  );
};

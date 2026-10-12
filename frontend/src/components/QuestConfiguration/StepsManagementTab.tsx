import React, { useState } from "react";
import { useUIConfig } from "../../context/UIConfigContext";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { saveConfigEdits } from "../../utils/localStorageConfig";

interface StepsManagementTabProps {
  onOpenCreate: () => void;
  onOpenEdit: (index: number) => void;
}

export const StepsManagementTab: React.FC<StepsManagementTabProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { uiConfigRaw, configKey: currentUITheme, applyConfig } = useUIConfig();
  const {
    selectedQuestId,
    activeLocalConfigKey,
    selectedQuest,
    deleteQuestStep,
    isSubmitting,
  } = useApiQuestContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const steps = uiConfigRaw?.steps ?? [];
  const apiStepsMode = selectedQuestId !== null && activeLocalConfigKey === null;
  const localQuestKey = activeLocalConfigKey || currentUITheme || "";

  const handleDelete = async (index: number) => {
    const step = steps[index];
    const displayLabel = step.label || `Step ${step.taskNumber}`;
    if (!window.confirm(`Delete ${displayLabel}?`)) {
      return;
    }

    if (apiStepsMode) {
      const stepId =
        step.apiStepId ??
        selectedQuest?.steps?.find((s) => s.taskNumber === step.taskNumber)?.id;
      if (stepId === undefined) {
        alert("Cannot delete step: missing server step id. Reload the quest and try again.");
        return;
      }
      const err = await deleteQuestStep(stepId);
      if (err) alert(err);
      return;
    }

    if (!uiConfigRaw) return;
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    const updatedConfig = { ...uiConfigRaw, steps: newSteps };
    if (localQuestKey) {
      saveConfigEdits(localQuestKey, updatedConfig);
    }
    applyConfig(updatedConfig);
  };

  return (
    <div className="quest-config__steps">
      <h2 className="quest-config__section-title">1. Steps Management</h2>

      <div className="quest-config__steps-card">
        <div className="quest-config__steps-card-header">
          <span className="quest-config__section-count">
            Total steps:{" "}
            <span className="quest-config__steps-count-badge">{steps.length}</span>
          </span>
        </div>

        <div className="quest-config__steps-list">
          {steps.map((step, index) => {
            const displayLabel = step.label || `Step ${step.taskNumber}`;
            const badgeColor = step.color;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={`step-${step.taskNumber}-${step.apiStepId ?? index}`}
                className={`quest-config__step-row${isHovered ? " quest-config__step-row--hovered" : ""}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className={`quest-config__step-badge${badgeColor ? " quest-config__step-badge--custom" : ""}`}
                  style={badgeColor ? ({ "--step-color": badgeColor } as React.CSSProperties) : undefined}
                >
                  {step.taskNumber}
                </span>
                <span className="quest-config__step-label">{displayLabel}</span>
                <div className="quest-config__step-actions">
                  <button
                    type="button"
                    className="quest-config__step-edit"
                    onClick={() => onOpenEdit(index)}
                    disabled={isSubmitting}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M9.5 1.5L12.5 4.5L5 12H2V9L9.5 1.5Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="quest-config__step-delete"
                    onClick={() => void handleDelete(index)}
                    disabled={isSubmitting}
                    aria-label={`Delete ${displayLabel}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d="M2 2L10 10M10 2L2 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="quest-config__add-step" onClick={onOpenCreate} disabled={isSubmitting}>
            <span className="quest-config__add-step-icon" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            Add step
          </button>
        </div>
      </div>
    </div>
  );
};

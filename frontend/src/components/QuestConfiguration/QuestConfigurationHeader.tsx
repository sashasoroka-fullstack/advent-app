import React, { useMemo } from "react";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { LOCAL_QUEST_PRESETS } from "../../constants/localQuestPresets";
import { useUIConfig } from "../../context/UIConfigContext";

interface QuestConfigurationHeaderProps {
  onClose: () => void;
  isQuestPickerOpen: boolean;
  onToggleQuestPicker: () => void;
}

export const QuestConfigurationHeader: React.FC<QuestConfigurationHeaderProps> = ({
  onClose,
  isQuestPickerOpen,
  onToggleQuestPicker,
}) => {
  const { uiConfig } = useUIConfig();
  const { quests, selectedQuestId, selectedQuest, activeLocalConfigKey } = useApiQuestContext();

  const questList = Array.isArray(quests) ? quests : [];

  const currentQuestInfo = useMemo(() => {
    if (activeLocalConfigKey) {
      const preset = LOCAL_QUEST_PRESETS.find((p) => p.configKey === activeLocalConfigKey);
      return preset
        ? { name: preset.name, previewUrl: preset.previewUrl }
        : { name: "Built-in quest", previewUrl: null as string | null };
    }
    const q = questList.find((x) => x.id === selectedQuestId) || selectedQuest;
    return q
      ? { name: q.name, previewUrl: q.backgroundMedia?.url ?? null }
      : { name: "Select Quest", previewUrl: null as string | null };
  }, [activeLocalConfigKey, questList, selectedQuestId, selectedQuest]);

  const mapThumbUrl =
    uiConfig?.map?.mapSvg ||
    currentQuestInfo.previewUrl ||
    uiConfig?.map?.background ||
    null;

  return (
    <header className="quest-config__header">
      {mapThumbUrl ? (
        <img className="quest-config__map-thumb" src={mapThumbUrl} alt="" />
      ) : (
        <div className="quest-config__map-thumb quest-config__map-thumb--placeholder">🗺️</div>
      )}

      <div className="quest-config__quest-select">
        <button
          type="button"
          className="quest-config__quest-trigger"
          onClick={onToggleQuestPicker}
          aria-expanded={isQuestPickerOpen}
          aria-haspopup="listbox"
        >
          <span className="quest-config__quest-trigger-label">Quests:&nbsp;</span>
          <span className="quest-config__quest-trigger-name">{currentQuestInfo.name}</span>
          <svg
            className={`quest-config__quest-trigger-chevron${isQuestPickerOpen ? " quest-config__quest-trigger-chevron--open" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <button
        type="button"
        className="quest-config__close"
        onClick={onClose}
        aria-label="Close configuration"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M4 4L14 14M14 4L4 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
};

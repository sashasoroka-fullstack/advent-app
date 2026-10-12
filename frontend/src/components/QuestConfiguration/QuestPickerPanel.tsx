import React, { useMemo } from "react";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { LOCAL_QUEST_PRESETS } from "../../constants/localQuestPresets";

export type QuestPickerItem =
  | {
      kind: "local";
      id: string;
      name: string;
      previewUrl: string;
      configKey: string;
    }
  | {
      kind: "api";
      id: number;
      name: string;
      previewUrl: string | null;
      isActive: boolean;
    };

interface QuestPickerPanelProps {
  onSelect: () => void;
  onAddQuest: () => void;
}

export const QuestPickerPanel: React.FC<QuestPickerPanelProps> = ({ onSelect, onAddQuest }) => {
  const {
    quests,
    selectedQuestId,
    activeLocalConfigKey,
    isLoading,
    isSubmitting,
    error,
    selectQuest,
    selectLocalPreset,
    deleteQuest,
    setQuestAsActiveForAll,
  } = useApiQuestContext();

  const questList = Array.isArray(quests) ? quests : [];

  const items = useMemo<QuestPickerItem[]>(() => {
    const localItems: QuestPickerItem[] = LOCAL_QUEST_PRESETS.map((preset) => ({
      kind: "local",
      id: `local-${preset.configKey}`,
      name: preset.name,
      previewUrl: preset.previewUrl,
      configKey: preset.configKey,
    }));
    const apiItems: QuestPickerItem[] = questList.map((quest) => ({
      kind: "api",
      id: quest.id,
      name: quest.name,
      previewUrl: quest.backgroundMedia?.url ?? null,
      isActive: quest.isActive === true,
    }));
    return [...localItems, ...apiItems];
  }, [questList]);

  const isItemSelected = (item: QuestPickerItem): boolean => {
    if (item.kind === "local") {
      return activeLocalConfigKey === item.configKey;
    }
    return !activeLocalConfigKey && selectedQuestId === item.id;
  };

  const handleSelect = async (item: QuestPickerItem) => {
    if (item.kind === "local") {
      await selectLocalPreset(item.configKey);
    } else {
      await selectQuest(item.id);
    }
    onSelect();
  };

  const handleSetActive = async (e: React.MouseEvent, item: QuestPickerItem) => {
    e.stopPropagation();
    if (item.kind !== "api" || item.isActive) return;
    const err = await setQuestAsActiveForAll(item.id);
    if (err !== null) {
      window.alert(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: QuestPickerItem) => {
    e.stopPropagation();
    if (item.kind !== "api") return;
    if (!window.confirm(`Delete quest "${item.name}"? This cannot be undone.`)) {
      return;
    }
    const err = await deleteQuest(item.id);
    if (err !== null) {
      window.alert(err);
    }
  };

  return (
    <div className="quest-picker">
      <h2 className="quest-picker__title">Select Quest</h2>

      {error && <div className="quest-picker__error">{error}</div>}

      <div className="quest-picker__list">
        {isLoading && questList.length === 0 ? (
          <div className="quest-picker__empty">Loading quests…</div>
        ) : items.length === 0 ? (
          <div className="quest-picker__empty">No quests yet</div>
        ) : (
          items.map((item) => {
            const selected = isItemSelected(item);
            const isApi = item.kind === "api";
            const isGlobalActive = isApi && item.isActive;

            return (
              <div
                key={item.id}
                className={`quest-picker__row${selected ? " quest-picker__row--selected" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => void handleSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleSelect(item);
                  }
                }}
              >
                {item.previewUrl ? (
                  <img className="quest-picker__thumb" src={item.previewUrl} alt="" />
                ) : (
                  <span className="quest-picker__thumb quest-picker__thumb--placeholder">🗺️</span>
                )}

                <span className="quest-picker__name">{item.name}</span>

                <div className="quest-picker__actions">
                  <button
                    type="button"
                    className={`quest-picker__star${isGlobalActive ? " quest-picker__star--active" : ""}`}
                    onClick={(e) => void handleSetActive(e, item)}
                    disabled={isSubmitting || !isApi || isGlobalActive}
                    aria-label={
                      isGlobalActive
                        ? `Active quest for all users: ${item.name}`
                        : `Set as active quest for all users: ${item.name}`
                    }
                    title={isApi ? (isGlobalActive ? "Active for all users" : "Set as active for all users") : undefined}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                      <path
                        d="M9 1.5L11.02 6.58L16.5 7.13L12.25 10.92L13.53 16.5L9 13.83L4.47 16.5L5.75 10.92L1.5 7.13L6.98 6.58L9 1.5Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                        fill={isGlobalActive ? "currentColor" : "none"}
                      />
                    </svg>
                  </button>

                  {isApi && (
                    <>
                      <span className="quest-picker__divider" aria-hidden />
                      <button
                        type="button"
                        className="quest-picker__delete"
                        onClick={(e) => void handleDelete(e, item)}
                        disabled={isSubmitting}
                        aria-label={`Delete quest: ${item.name}`}
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
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button type="button" className="quest-picker__add" onClick={onAddQuest} disabled={isSubmitting}>
        <span className="quest-picker__add-icon" aria-hidden>+</span>
        Add Quest
      </button>
    </div>
  );
};

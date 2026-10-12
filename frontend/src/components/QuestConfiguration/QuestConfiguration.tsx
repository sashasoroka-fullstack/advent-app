import React, { useState } from "react";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { QuestConfigurationHeader } from "./QuestConfigurationHeader";
import { StepsManagementTab } from "./StepsManagementTab";
import { DataSourceTab } from "./DataSourceTab";
import { StepForm } from "./StepForm";
import { QuestPickerPanel } from "./QuestPickerPanel";
import { QuestCreateForm } from "./QuestCreateForm";
import "./QuestConfiguration.css";

type ConfigTab = "steps" | "datasource";
type StepPanel = { mode: "create" } | { mode: "edit"; index: number };

export const QuestConfiguration: React.FC = () => {
  const { selectedQuestId, activeLocalConfigKey } = useApiQuestContext();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ConfigTab>("steps");
  const [stepPanel, setStepPanel] = useState<StepPanel | null>(null);
  const [isQuestPickerOpen, setIsQuestPickerOpen] = useState(false);
  const [isQuestCreateOpen, setIsQuestCreateOpen] = useState(false);

  const hasQuestSelected = selectedQuestId !== null || activeLocalConfigKey !== null;

  if (!isOpen) {
    return (
      <button
        type="button"
        className="quest-config quest-config__trigger"
        onClick={() => setIsOpen(true)}
      >
        Configuration
      </button>
    );
  }

  const closePanel = () => {
    setIsOpen(false);
    setStepPanel(null);
    setIsQuestCreateOpen(false);
    setIsQuestPickerOpen(false);
  };

  if (stepPanel) {
    return (
      <aside className="quest-config quest-config__panel" aria-label="Quest configuration">
        <StepForm
          mode={stepPanel.mode}
          editIndex={stepPanel.mode === "edit" ? stepPanel.index : undefined}
          onBack={() => setStepPanel(null)}
          onClose={closePanel}
        />
      </aside>
    );
  }

  if (isQuestCreateOpen) {
    return (
      <aside className="quest-config quest-config__panel" aria-label="Quest configuration">
        <QuestCreateForm
          onBack={() => setIsQuestCreateOpen(false)}
          onClose={closePanel}
          onCreated={() => {
            setIsQuestCreateOpen(false);
            setIsQuestPickerOpen(false);
          }}
        />
      </aside>
    );
  }

  return (
    <aside className="quest-config quest-config__panel" aria-label="Quest configuration">
      <QuestConfigurationHeader
        onClose={closePanel}
        isQuestPickerOpen={isQuestPickerOpen}
        onToggleQuestPicker={() => setIsQuestPickerOpen((open) => !open)}
      />

      {(!hasQuestSelected || isQuestPickerOpen) && (
        <QuestPickerPanel
          onSelect={() => setIsQuestPickerOpen(false)}
          onAddQuest={() => setIsQuestCreateOpen(true)}
        />
      )}

      {hasQuestSelected && !isQuestPickerOpen && (
        <>
          <nav className="quest-config__tabs" aria-label="Configuration sections">
            <button
              type="button"
              className={`quest-config__tab${activeTab === "steps" ? " quest-config__tab--active" : ""}`}
              onClick={() => setActiveTab("steps")}
            >
              Steps Management
            </button>
            <button
              type="button"
              className={`quest-config__tab${activeTab === "datasource" ? " quest-config__tab--active" : ""}`}
              onClick={() => setActiveTab("datasource")}
            >
              Data Source
            </button>
          </nav>

          <div className="quest-config__body">
            {activeTab === "steps" && (
              <StepsManagementTab
                onOpenCreate={() => setStepPanel({ mode: "create" })}
                onOpenEdit={(index) => setStepPanel({ mode: "edit", index })}
              />
            )}
            {activeTab === "datasource" && <DataSourceTab />}
          </div>
        </>
      )}
    </aside>
  );
};

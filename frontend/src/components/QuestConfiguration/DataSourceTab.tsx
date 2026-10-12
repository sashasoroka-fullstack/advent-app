import React, { useEffect, useRef, useState } from "react";
import { useQuestDataContext, DataSourceConfig } from "../../context/QuestDataContext";
import { useApiQuestContext } from "../../context/ApiQuestContext";
import { useUIConfig } from "../../context/UIConfigContext";
import { DataSourceType } from "../../services/types";
import { logger } from "../../utils/logger";
import { saveConfigEdits } from "../../utils/localStorageConfig";

export const DataSourceTab: React.FC = () => {
  const {
    data: currentData,
    isLoading: dataLoading,
    error: dataError,
    currentSourceType,
    switchDataSource,
    clearData,
  } = useQuestDataContext();
  const { uiConfigRaw, configKey: currentUITheme, applyConfig } = useUIConfig();
  const {
    selectedQuestId,
    activeLocalConfigKey,
    selectedQuest,
    setQuestGoogleSheetUrl,
    isSubmitting: apiQuestSubmitting,
  } = useApiQuestContext();

  const isApiQuestMode = selectedQuestId !== null && activeLocalConfigKey === null;
  const localQuestKey = activeLocalConfigKey || currentUITheme || "";
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const lastLoadedUrlRef = useRef("");
  const prevConfigKeyRef = useRef<string | null>(null);
  const prevUiConfigUrlRef = useRef("");

  useEffect(() => {
    if (isApiQuestMode) {
      const url = selectedQuest?.googleSheetUrl?.trim() || "";
      setGoogleSheetUrl(url);
      lastLoadedUrlRef.current = url;
      return;
    }
    if (!localQuestKey) {
      return;
    }
    const storageKey = `questGoogleSheetUrl:${localQuestKey}`;
    const savedUrl = localStorage.getItem(storageKey);
    if (savedUrl && savedUrl.trim() !== "" && savedUrl !== googleSheetUrl) {
      setGoogleSheetUrl(savedUrl);
    } else if (!savedUrl && googleSheetUrl !== "") {
      setGoogleSheetUrl("");
    }
  }, [isApiQuestMode, selectedQuest?.id, selectedQuest?.googleSheetUrl, localQuestKey]);

  useEffect(() => {
    if (!uiConfigRaw || isApiQuestMode) {
      if (isApiQuestMode) {
        prevConfigKeyRef.current = currentUITheme || null;
      }
      return;
    }
    const newUrl = uiConfigRaw.googleSheetUrl || "";
    const configKeyChanged = prevConfigKeyRef.current !== localQuestKey;
    prevConfigKeyRef.current = localQuestKey || null;
    const urlInConfigChanged = prevUiConfigUrlRef.current !== newUrl;
    prevUiConfigUrlRef.current = newUrl;
    const storageKey = localQuestKey ? `questGoogleSheetUrl:${localQuestKey}` : null;
    const savedUrl = storageKey ? localStorage.getItem(storageKey) : null;
    const urlToUse = savedUrl || newUrl;
    if (configKeyChanged) {
      setGoogleSheetUrl(urlToUse);
    } else if (urlInConfigChanged && urlToUse !== googleSheetUrl && !savedUrl && googleSheetUrl === "") {
      setGoogleSheetUrl(urlToUse);
    }
  }, [uiConfigRaw, localQuestKey, isApiQuestMode, currentUITheme, googleSheetUrl]);

  const handleLoadData = async () => {
    if (!googleSheetUrl || googleSheetUrl.trim() === "") {
      alert("Please enter a Google Sheet URL");
      return;
    }
    if (!isApiQuestMode && !localQuestKey) {
      alert("No quest selected. Please select a quest first.");
      return;
    }
    if (isApiQuestMode && selectedQuestId === null) {
      alert("No API quest selected.");
      return;
    }
    try {
      const trimmedUrl = googleSheetUrl.trim();
      if (isApiQuestMode) {
        const saveErr = await setQuestGoogleSheetUrl(trimmedUrl);
        if (saveErr !== null) {
          alert(saveErr);
          return;
        }
      } else {
        const storageKey = `questGoogleSheetUrl:${localQuestKey}`;
        const sourceTypeKey = `questDataSourceType:${localQuestKey}`;
        const clearedKey = `questDataCleared:local:${localQuestKey}`;
        localStorage.setItem(storageKey, trimmedUrl);
        localStorage.setItem(sourceTypeKey, DataSourceType.GOOGLE_SHEETS);
        localStorage.removeItem(clearedKey);
      }
      const config: DataSourceConfig = {
        type: DataSourceType.GOOGLE_SHEETS,
        url: trimmedUrl,
      };
      await switchDataSource(config);
      lastLoadedUrlRef.current = trimmedUrl;
      if (!isApiQuestMode && uiConfigRaw) {
        const updatedConfig = { ...uiConfigRaw, googleSheetUrl: trimmedUrl };
        if (localQuestKey) {
          saveConfigEdits(localQuestKey, updatedConfig);
        }
      }
    } catch (err) {
      logger.error("DataSourceTab", "Failed to load Google Sheet:", err);
      alert(`Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleClearData = async () => {
    if (isApiQuestMode) {
      const saveErr = await setQuestGoogleSheetUrl(null);
      if (saveErr !== null) {
        alert(saveErr);
        return;
      }
      setGoogleSheetUrl("");
    } else {
      setGoogleSheetUrl("");
      if (localQuestKey) {
        const storageKey = `questGoogleSheetUrl:${localQuestKey}`;
        const sourceTypeKey = `questDataSourceType:${localQuestKey}`;
        const clearedKey = `questDataCleared:local:${localQuestKey}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(sourceTypeKey);
        localStorage.setItem(clearedKey, "true");
      }
      if (uiConfigRaw) {
        const updatedConfig = { ...uiConfigRaw, googleSheetUrl: undefined };
        if (localQuestKey) {
          saveConfigEdits(localQuestKey, updatedConfig);
        }
        applyConfig(updatedConfig);
      }
    }
    clearData();
    lastLoadedUrlRef.current = "";
  };

  const isBusy = dataLoading || apiQuestSubmitting;
  const canLoad = !isBusy && googleSheetUrl.trim() !== "";

  return (
    <div className="quest-config__datasource">
      <h2 className="quest-config__section-title">2. Data Source</h2>

      <div className="quest-config__datasource-card">
        <label className="quest-config__field-label" htmlFor="qc-google-sheet-url">
          Google Sheet URL
        </label>
        <input
          id="qc-google-sheet-url"
          type="text"
          className="quest-config__field-input"
          value={googleSheetUrl}
          onChange={(e) => setGoogleSheetUrl(e.target.value)}
          placeholder="Enter Google Sheet Url"
        />
        <p className="quest-config__field-hint">
          Enter the Google Sheet CSV export URL and click &quot;Load Data&quot; to fetch user data...
        </p>

        <div className="quest-config__datasource-actions">
          <button
            type="button"
            className="quest-config__datasource-btn quest-config__datasource-btn--clear"
            onClick={() => void handleClearData()}
            disabled={isBusy}
          >
            Clear
          </button>
          <button
            type="button"
            className="quest-config__datasource-btn quest-config__datasource-btn--load"
            onClick={() => void handleLoadData()}
            disabled={!canLoad}
          >
            {isBusy ? "Loading..." : "Load Data"}
          </button>
        </div>

        <div className="quest-config__datasource-status">
          <p className="quest-config__datasource-status-line">
            Current Source: {currentSourceType || "None"}
          </p>
          <p className="quest-config__datasource-status-line">
            Data Count: {currentData.length}
          </p>
        </div>

        {dataLoading && (
          <p className="quest-config__datasource-feedback">Loading data...</p>
        )}
        {dataError && (
          <p className="quest-config__datasource-feedback quest-config__datasource-feedback--error">
            {dataError}
          </p>
        )}
      </div>
    </div>
  );
};

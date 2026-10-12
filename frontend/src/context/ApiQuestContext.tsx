import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { useAuthContext } from "../auth/AuthContext";
import { hasPrivilegedRole } from "../auth/userRole";
import { ApiQuest, CreateApiQuestPayload, CreateApiQuestStepPayload, questsApi, UpdateApiQuestStepPayload, } from "../services/api/questsApi";
import { useUIConfig } from "./UIConfigContext";
import { UIConfigJSON } from "../services/uiConfigSchema";
import { logger } from "../utils/logger";
import { isLocalQuestPresetKey, LOCAL_QUEST_PRESETS, } from "../constants/localQuestPresets";
import { readQuestListSelection, writeQuestListSelection, } from "../utils/questListSelectionStorage";
import { readQuestIdFromSearchParams, setQuestUrlParam, } from "../utils/questUrlParams";
import { questToUIConfig } from "./questUiConfig";
interface ApiQuestContextState {
    quests: ApiQuest[];
    selectedQuestId: number | null;
    selectedQuest: ApiQuest | null;
    activeLocalConfigKey: string | null;
    hasPrivilegedRole: boolean;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    reloadQuests: () => Promise<void>;
    selectQuest: (questId: number) => Promise<void>;
    selectLocalPreset: (configKey: string) => Promise<void>;
    setQuestAsActiveForAll: (questId: number) => Promise<string | null>;
    createQuest: (payload: CreateApiQuestPayload) => Promise<string | null>;
    deleteQuest: (questId: number) => Promise<string | null>;
    createQuestStep: (payload: CreateApiQuestStepPayload) => Promise<string | null>;
    updateQuestStep: (stepId: number, payload: UpdateApiQuestStepPayload) => Promise<string | null>;
    deleteQuestStep: (stepId: number) => Promise<string | null>;
    setQuestGoogleSheetUrl: (url: string | null) => Promise<string | null>;
}
const ApiQuestContext = createContext<ApiQuestContextState | undefined>(undefined);
interface ApiQuestProviderProps {
    children: React.ReactNode;
}
export const ApiQuestProvider: React.FC<ApiQuestProviderProps> = ({ children, }) => {
    const { user } = useAuthContext();
    const userHasPrivilegedRole = useMemo(() => hasPrivilegedRole(user), [user]);
    const [quests, setQuests] = useState<ApiQuest[]>([]);
    const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<ApiQuest | null>(null);
    const [activeLocalConfigKey, setActiveLocalConfigKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { uiConfigRaw, applyConfig, switchConfig } = useUIConfig();
    const baseUiTemplateRef = useRef<UIConfigJSON | null>(null);
    const templateCapturedRef = useRef(false);
    const prevHasPrivilegedRoleRef = useRef(userHasPrivilegedRole);
    const reloadQuestsRef = useRef<() => Promise<void>>(async () => undefined);
    useEffect(() => {
        if (!uiConfigRaw || templateCapturedRef.current) {
            return;
        }
        templateCapturedRef.current = true;
        baseUiTemplateRef.current = uiConfigRaw;
        void reloadQuestsRef.current();
    }, [uiConfigRaw]);
    const applyQuestUIConfig = useCallback((quest: ApiQuest) => {
        const template = baseUiTemplateRef.current;
        if (!template) {
            return;
        }
        applyConfig(questToUIConfig(quest, template));
    }, [applyConfig]);
    const selectQuest = useCallback(async (questId: number) => {
        if (!userHasPrivilegedRole) {
            const activeQuest = await questsApi.getActive();
            if (activeQuest.id !== questId) {
                setError("Only the active quest is available to your role");
                return;
            }
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const fullQuest = await questsApi.getById(questId);
            setSelectedQuestId(fullQuest.id);
            setSelectedQuest(fullQuest);
            setActiveLocalConfigKey(null);
            writeQuestListSelection({ mode: "api", questId: fullQuest.id });
            setQuestUrlParam(fullQuest.id);
            applyQuestUIConfig(fullQuest);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to select quest", err);
        }
        finally {
            setIsSubmitting(false);
        }
    }, [applyQuestUIConfig, userHasPrivilegedRole]);
    const selectLocalPreset = useCallback(async (configKey: string) => {
        if (!userHasPrivilegedRole) {
            setError("Local quest presets are only available to privileged users");
            return;
        }
        if (!isLocalQuestPresetKey(configKey)) {
            logger.warn("ApiQuestContext", `Unknown local quest preset: ${configKey}`);
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await switchConfig(configKey);
            setSelectedQuestId(null);
            setSelectedQuest(null);
            setActiveLocalConfigKey(configKey);
            writeQuestListSelection({ mode: "local", configKey });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to switch local preset", err);
        }
        finally {
            setIsSubmitting(false);
        }
    }, [switchConfig, userHasPrivilegedRole]);
    const reloadQuests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!userHasPrivilegedRole) {
                const activeQuest = await questsApi.getActive();
                setQuests([activeQuest]);
                setActiveLocalConfigKey(null);
                await selectQuest(activeQuest.id);
                return;
            }
            const questList = await questsApi.list();
            setQuests(Array.isArray(questList) ? questList : []);
            const urlQuestId = readQuestIdFromSearchParams();
            const urlQuestOk = urlQuestId !== null &&
                questList.some((q) => q.id === urlQuestId);
            if (urlQuestOk) {
                await selectQuest(urlQuestId);
                return;
            }
            const stored = readQuestListSelection();
            if (stored?.mode === "local" &&
                isLocalQuestPresetKey(stored.configKey)) {
                await switchConfig(stored.configKey);
                setSelectedQuestId(null);
                setSelectedQuest(null);
                setActiveLocalConfigKey(stored.configKey);
                return;
            }
            if (questList.length === 0) {
                setSelectedQuestId(null);
                setSelectedQuest(null);
                setActiveLocalConfigKey(null);
                return;
            }
            const globalActive = questList.find((q) => q.isActive);
            const preferredQuestId = stored?.mode === "api" &&
                questList.some((q) => q.id === stored.questId)
                ? stored.questId
                : globalActive?.id ?? questList[0].id;
            await selectQuest(preferredQuestId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to load quests", err);
        }
        finally {
            setIsLoading(false);
        }
    }, [selectQuest, switchConfig, userHasPrivilegedRole]);
    const setQuestAsActiveForAll = useCallback(async (questId: number): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const updated = await questsApi.selectForAll(questId);
            setQuests((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.map((q) => ({
                    ...q,
                    isActive: q.id === updated.id,
                }));
            });
            await selectQuest(updated.id);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to set active quest for all users", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [userHasPrivilegedRole, selectQuest]);
    const createQuest = useCallback(async (payload: CreateApiQuestPayload): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const createdQuest = await questsApi.create(payload);
            setQuests((prev) => [
                createdQuest,
                ...(Array.isArray(prev) ? prev : []),
            ]);
            await selectQuest(createdQuest.id);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to create quest", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [selectQuest, userHasPrivilegedRole]);
    const deleteQuest = useCallback(async (questId: number): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await questsApi.delete(questId);
            let filtered: ApiQuest[] = [];
            setQuests((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                filtered = arr.filter((q) => q.id !== questId);
                return filtered;
            });
            const wasSelected = !activeLocalConfigKey && selectedQuestId === questId;
            if (wasSelected) {
                if (filtered.length > 0) {
                    await selectQuest(filtered[0].id);
                }
                else {
                    await selectLocalPreset(LOCAL_QUEST_PRESETS[0].configKey);
                }
            }
            else {
                setSelectedQuest((prev) => (prev?.id === questId ? null : prev));
            }
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to delete quest", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [activeLocalConfigKey, selectedQuestId, selectQuest, selectLocalPreset, userHasPrivilegedRole]);
    const refreshSelectedQuestFromServer = useCallback(async (questId: number) => {
        try {
            const fullQuest = await questsApi.getById(questId);
            setSelectedQuest(fullQuest);
            applyQuestUIConfig(fullQuest);
            setQuests((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.map((q) => (q.id === questId ? { ...q, ...fullQuest } : q));
            });
        }
        catch (err) {
            logger.error("ApiQuestContext", "Failed to refresh quest from server", err);
            throw err;
        }
    }, [applyQuestUIConfig]);
    const createQuestStep = useCallback(async (payload: CreateApiQuestStepPayload): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        const questId = selectedQuestId;
        if (questId === null) {
            return "No API quest is selected.";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await questsApi.createStep(questId, payload);
            await refreshSelectedQuestFromServer(questId);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to create quest step", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [selectedQuestId, refreshSelectedQuestFromServer, userHasPrivilegedRole]);
    const updateQuestStep = useCallback(async (stepId: number, payload: UpdateApiQuestStepPayload): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        const questId = selectedQuestId;
        if (questId === null) {
            return "No API quest is selected.";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await questsApi.updateStep(questId, stepId, payload);
            await refreshSelectedQuestFromServer(questId);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to update quest step", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [selectedQuestId, refreshSelectedQuestFromServer, userHasPrivilegedRole]);
    const deleteQuestStep = useCallback(async (stepId: number): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        const questId = selectedQuestId;
        if (questId === null) {
            return "No API quest is selected.";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await questsApi.deleteStep(questId, stepId);
            await refreshSelectedQuestFromServer(questId);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to delete quest step", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [selectedQuestId, refreshSelectedQuestFromServer, userHasPrivilegedRole]);
    const setQuestGoogleSheetUrl = useCallback(async (url: string | null): Promise<string | null> => {
        if (!userHasPrivilegedRole) {
            return "Privileged role required";
        }
        const questId = selectedQuestId;
        if (questId === null) {
            return "No API quest is selected.";
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await questsApi.update(questId, { googleSheetUrl: url });
            await refreshSelectedQuestFromServer(questId);
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            logger.error("ApiQuestContext", "Failed to update quest data source URL", err);
            return message;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [selectedQuestId, refreshSelectedQuestFromServer, userHasPrivilegedRole]);
    reloadQuestsRef.current = reloadQuests;
    useEffect(() => {
        if (!templateCapturedRef.current) {
            return;
        }
        if (prevHasPrivilegedRoleRef.current === userHasPrivilegedRole) {
            return;
        }
        prevHasPrivilegedRoleRef.current = userHasPrivilegedRole;
        void reloadQuestsRef.current();
    }, [userHasPrivilegedRole]);
    const value = useMemo<ApiQuestContextState>(() => ({
        quests,
        selectedQuestId,
        selectedQuest,
        activeLocalConfigKey,
        hasPrivilegedRole: userHasPrivilegedRole,
        isLoading,
        isSubmitting,
        error,
        reloadQuests,
        selectQuest,
        selectLocalPreset,
        setQuestAsActiveForAll,
        createQuest,
        deleteQuest,
        createQuestStep,
        updateQuestStep,
        deleteQuestStep,
        setQuestGoogleSheetUrl,
    }), [
        quests,
        selectedQuestId,
        selectedQuest,
        activeLocalConfigKey,
        userHasPrivilegedRole,
        isLoading,
        isSubmitting,
        error,
        reloadQuests,
        selectQuest,
        selectLocalPreset,
        setQuestAsActiveForAll,
        createQuest,
        deleteQuest,
        createQuestStep,
        updateQuestStep,
        deleteQuestStep,
        setQuestGoogleSheetUrl,
    ]);
    return (<ApiQuestContext.Provider value={value}>
      {children}
    </ApiQuestContext.Provider>);
};
export const useApiQuestContext = (): ApiQuestContextState => {
    const context = useContext(ApiQuestContext);
    if (!context) {
        throw new Error("useApiQuestContext must be used within ApiQuestProvider");
    }
    return context;
};


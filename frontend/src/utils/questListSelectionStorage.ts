const QUEST_SELECTION_KEY = "adventQuestSelection";
const LEGACY_QUEST_ID_KEY = "selectedApiQuestId";
const LEGACY_QUEST_ID_KEY_OLD = "selectedBackendQuestId";
export type QuestListSelection = {
    mode: "local";
    configKey: string;
} | {
    mode: "api";
    questId: number;
};
function normalizeSelectionFromJson(v: unknown): QuestListSelection | null {
    if (!v || typeof v !== "object") {
        return null;
    }
    const o = v as Record<string, unknown>;
    if (o.mode === "local" && typeof o.configKey === "string") {
        return { mode: "local", configKey: o.configKey };
    }
    const isApiMode = o.mode === "api" || o.mode === "backend";
    if (isApiMode &&
        typeof o.questId === "number" &&
        Number.isInteger(o.questId)) {
        return { mode: "api", questId: o.questId };
    }
    return null;
}
export function readQuestListSelection(): QuestListSelection | null {
    try {
        const raw = localStorage.getItem(QUEST_SELECTION_KEY);
        if (raw) {
            const v = JSON.parse(raw) as unknown;
            const normalized = normalizeSelectionFromJson(v);
            if (normalized) {
                return normalized;
            }
        }
    }
    catch {
        void 0;
    }
    const idNew = Number(localStorage.getItem(LEGACY_QUEST_ID_KEY));
    if (Number.isInteger(idNew) && idNew > 0) {
        return { mode: "api", questId: idNew };
    }
    const idOld = Number(localStorage.getItem(LEGACY_QUEST_ID_KEY_OLD));
    if (Number.isInteger(idOld) && idOld > 0) {
        return { mode: "api", questId: idOld };
    }
    return null;
}
export function writeQuestListSelection(selection: QuestListSelection): void {
    localStorage.setItem(QUEST_SELECTION_KEY, JSON.stringify(selection));
    if (selection.mode === "api") {
        localStorage.setItem(LEGACY_QUEST_ID_KEY, String(selection.questId));
        localStorage.removeItem(LEGACY_QUEST_ID_KEY_OLD);
    }
    else {
        localStorage.removeItem(LEGACY_QUEST_ID_KEY);
        localStorage.removeItem(LEGACY_QUEST_ID_KEY_OLD);
    }
}

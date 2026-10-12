export const QUEST_URL_PARAM = "quest";
export function readQuestIdFromSearchParams(): number | null {
    const raw = new URLSearchParams(window.location.search).get(QUEST_URL_PARAM);
    if (raw === null || raw === "") {
        return null;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
        return null;
    }
    return n;
}
export function setQuestUrlParam(questId: number): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("ui");
    url.searchParams.set(QUEST_URL_PARAM, String(questId));
    window.history.replaceState({}, "", url.toString());
}

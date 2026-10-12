export function isApiQuestDataScope(selectedQuestId: number | null, activeLocalConfigKey: string | null): boolean {
    return selectedQuestId !== null && activeLocalConfigKey === null;
}

export function getQuestDataScopeKey(selectedQuestId: number | null, activeLocalConfigKey: string | null, localConfigKey: string): string {
    if (isApiQuestDataScope(selectedQuestId, activeLocalConfigKey)) {
        return `api:${selectedQuestId}`;
    }
    const localKey = activeLocalConfigKey || localConfigKey;
    return `local:${localKey}`;
}

export function getLocalQuestStorageKey(localConfigKey: string): string {
    return localConfigKey;
}

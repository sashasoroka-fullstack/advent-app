export const LOCAL_QUEST_PRESETS: ReadonlyArray<{
    configKey: string;
    name: string;
    previewUrl: string;
}> = [
    {
        configKey: "default",
        name: "Default Well Being Quest",
        previewUrl: "/assets/background/Quest_background.svg",
    },
    {
        configKey: "space-adventure",
        name: "Space Adventure Quest",
        previewUrl: "/assets/animations/space-background.svg",
    },
];
export function isLocalQuestPresetKey(key: string): boolean {
    return LOCAL_QUEST_PRESETS.some((p) => p.configKey === key);
}

export function isBuiltInLocalQuestPreset(configKey: string): boolean {
    return isLocalQuestPresetKey(configKey);
}

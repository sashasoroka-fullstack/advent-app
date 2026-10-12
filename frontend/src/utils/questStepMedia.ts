import { dataUrlToFile, fetchUrlAsFile, uploadMediaFile, } from "../services/api/mediaApi";
import { tryExtractApiMediaIdFromUrl } from "../services/api/questsApi";
export async function resolveStepIconMediaIdForCreate(icon: string, hasColor: boolean): Promise<string | null> {
    if (hasColor) {
        return null;
    }
    const extracted = tryExtractApiMediaIdFromUrl(icon);
    if (extracted) {
        return extracted;
    }
    if (icon.startsWith("data:")) {
        const media = await uploadMediaFile(dataUrlToFile(icon, "step-icon.png"));
        return media.id;
    }
    try {
        const file = await fetchUrlAsFile(icon, "step-icon.svg");
        const media = await uploadMediaFile(file);
        return media.id;
    }
    catch {
        return null;
    }
}
export async function resolveStepIconMediaIdForUpdate(editedIcon: string, originalIcon: string, hasColor: boolean): Promise<string | null | undefined> {
    if (hasColor) {
        return null;
    }
    if (editedIcon === originalIcon) {
        return undefined;
    }
    return resolveStepIconMediaIdForCreate(editedIcon, false);
}

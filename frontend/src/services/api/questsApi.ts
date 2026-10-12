import { apiRequest, resolveApiMediaUrl } from "./client";
import { logger } from "../../utils/logger";
export interface ApiMedia {
    id: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    url: string;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface ApiQuestStep {
    id: number;
    taskNumber: number;
    label: string | null;
    color: string | null;
    cyStep: number;
    cxStep: number;
    iconMediaId: string | null;
    iconMedia: ApiMedia | null;
    size: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApiQuest {
    id: number;
    name: string;
    slug: string;
    backgroundMediaId: string | null;
    backgroundMedia: ApiMedia | null;
    mapMediaId: string | null;
    mapMedia: ApiMedia | null;
    googleSheetUrl: string | null;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
    steps?: ApiQuestStep[];
}
export interface CreateApiQuestPayload {
    name: string;
    backgroundMediaId?: string;
    mapMediaId?: string;
}
export interface UpdateApiQuestPayload {
    name?: string;
    backgroundMediaId?: string | null;
    mapMediaId?: string | null;
    googleSheetUrl?: string | null;
}
export interface CreateApiQuestStepPayload {
    taskNumber: number;
    label?: string;
    color?: string;
    cyStep: number;
    cxStep: number;
    iconMediaId?: string | null;
    size: string;
}
export interface UpdateApiQuestStepPayload {
    taskNumber?: number;
    label?: string | null;
    color?: string | null;
    cyStep?: number;
    cxStep?: number;
    iconMediaId?: string | null;
    size?: string;
}
export function tryExtractApiMediaIdFromUrl(url: string): string | null {
    if (!url || typeof url !== "string") {
        return null;
    }
    const m = url.match(/\/media\/([0-9a-f-]{36})\//i);
    return m ? m[1] : null;
}
function normalizeQuestStep(data: ApiQuestStep): ApiQuestStep {
    return {
        ...data,
        iconMedia: normalizeApiMedia(data.iconMedia),
    };
}
function normalizeQuestList(data: unknown): ApiQuest[] {
    if (!Array.isArray(data)) {
        logger.warn("questsApi", "GET /quest returned a non-array (wrong URL, HTML fallback, or API shape). Using [].", { receivedType: typeof data });
        return [];
    }
    return (data as ApiQuest[]).map((q) => normalizeQuest(q));
}
function normalizeApiMedia(media: ApiMedia | null | undefined): ApiMedia | null {
    if (!media) {
        return null;
    }
    const raw = media.url?.trim() ?? "";
    const url = raw !== ""
        ? resolveApiMediaUrl(raw)
        : resolveApiMediaUrl(`/media/${media.id}/file`);
    return { ...media, url };
}
function normalizeQuest(data: ApiQuest): ApiQuest {
    const { steps: rawSteps, backgroundMedia, mapMedia, ...rest } = data;
    let steps: ApiQuest["steps"] | undefined;
    if (rawSteps === undefined) {
        steps = undefined;
    }
    else if (!Array.isArray(rawSteps)) {
        steps = [];
    }
    else {
        steps = rawSteps.map((s) => ({
            ...s,
            iconMedia: normalizeApiMedia(s.iconMedia),
        }));
    }
    return {
        ...rest,
        googleSheetUrl: data.googleSheetUrl ?? null,
        backgroundMedia: normalizeApiMedia(backgroundMedia),
        mapMedia: normalizeApiMedia(mapMedia),
        ...(steps !== undefined ? { steps } : {}),
    };
}
export const questsApi = {
    list: async (): Promise<ApiQuest[]> => {
        const data = await apiRequest<unknown>("/quest");
        return normalizeQuestList(data);
    },
    getActive: async (): Promise<ApiQuest> => {
        const data = await apiRequest<ApiQuest>("/quest/active");
        return normalizeQuest(data);
    },
    selectForAll: async (id: number): Promise<ApiQuest> => {
        const data = await apiRequest<ApiQuest>(`/quest/${id}/select`, {
            method: "PUT",
        });
        return normalizeQuest(data);
    },
    getById: async (id: number): Promise<ApiQuest> => {
        const data = await apiRequest<ApiQuest>(`/quest/${id}`);
        return normalizeQuest(data);
    },
    create: async (payload: CreateApiQuestPayload): Promise<ApiQuest> => {
        const data = await apiRequest<ApiQuest>("/quest", {
            method: "POST",
            body: payload,
        });
        return normalizeQuest(data);
    },
    update: async (id: number, payload: UpdateApiQuestPayload): Promise<ApiQuest> => {
        const data = await apiRequest<ApiQuest>(`/quest/${id}`, {
            method: "PUT",
            body: payload,
        });
        return normalizeQuest(data);
    },
    delete: async (id: number): Promise<void> => {
        await apiRequest<undefined>(`/quest/${id}`, { method: "DELETE" });
    },
    createStep: async (questId: number, payload: CreateApiQuestStepPayload): Promise<ApiQuestStep> => {
        const body: Record<string, unknown> = {
            taskNumber: payload.taskNumber,
            cyStep: payload.cyStep,
            cxStep: payload.cxStep,
            size: payload.size,
        };
        if (payload.label !== undefined && payload.label !== "") {
            body.label = payload.label;
        }
        if (payload.color !== undefined && payload.color !== "") {
            body.color = payload.color;
        }
        if (payload.iconMediaId !== undefined) {
            body.iconMediaId = payload.iconMediaId;
        }
        const data = await apiRequest<ApiQuestStep>(`/quest/${questId}/steps`, {
            method: "POST",
            body,
        });
        return normalizeQuestStep(data);
    },
    updateStep: async (questId: number, stepId: number, payload: UpdateApiQuestStepPayload): Promise<ApiQuestStep> => {
        const data = await apiRequest<ApiQuestStep>(`/quest/${questId}/steps/${stepId}`, {
            method: "PUT",
            body: payload,
        });
        return normalizeQuestStep(data);
    },
    deleteStep: async (questId: number, stepId: number): Promise<void> => {
        await apiRequest<undefined>(`/quest/${questId}/steps/${stepId}`, { method: "DELETE" });
    },
};

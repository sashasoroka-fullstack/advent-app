import { logger } from "../../utils/logger";
import { getApiAuthHeaders } from "./authToken";

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.toString().trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === "true") {
    return "http://localhost:3001";
  }
  logger.warn(
    "ApiClient",
    "VITE_API_BASE_URL is not set; configure it via CI APP_ENV_VARIABLES or .env"
  );
  return "";
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export function resolveApiMediaUrl(url: string | null | undefined): string {
  if (url == null || url === "") {
    return "";
  }
  const t = url.trim();
  if (/^(https?:|data:|blob:)/i.test(t)) {
    return t;
  }
  if (t.startsWith("//")) {
    return `${typeof window !== "undefined" ? window.location.protocol : "https:"}${t}`;
  }
  if (t.startsWith("/")) {
    return `${API_BASE_URL}${t}`;
  }
  return t;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromPayload(payload: unknown, status: number): string {
  let message = `Request failed with status ${status}`;
  if (payload && typeof payload === "object" && "message" in payload) {
    const m = (payload as { message?: unknown }).message;
    if (typeof m === "string") {
      message = m;
    } else if (Array.isArray(m) && m.every((x) => typeof x === "string")) {
      message = m.join(", ");
    }
  }
  return message;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  const payload = text ? tryParseJson(text) : null;
  if (!response.ok) {
    throw new ApiError(messageFromPayload(payload, response.status), response.status, payload);
  }
  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...getApiAuthHeaders(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return parseApiResponse<T>(response);
}

export async function apiFormRequest<T>(
  path: string,
  form: FormData,
  options: Omit<RequestOptions, "body"> = {}
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    method: options.method ?? "POST",
    headers: {
      ...getApiAuthHeaders(),
      ...(options.headers || {}),
    },
    body: form,
  });
  return parseApiResponse<T>(response);
}

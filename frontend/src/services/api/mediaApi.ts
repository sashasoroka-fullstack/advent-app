import { apiFormRequest, resolveApiMediaUrl } from "./client";
import type { ApiMedia } from "./questsApi";

export async function uploadMediaFile(file: File, altText?: string): Promise<ApiMedia> {
  const form = new FormData();
  form.append("file", file);
  if (altText?.trim()) {
    form.append("altText", altText.trim());
  }
  return apiFormRequest<ApiMedia>("/media", form, { method: "POST" });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(",");
  const meta = parts[0];
  const b64 = parts[1];
  if (!b64) {
    throw new Error("Invalid data URL");
  }
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export async function fetchUrlAsFile(url: string, filename: string): Promise<File> {
  const absolute = url.startsWith("http")
    ? url
    : url.startsWith("/media/")
      ? resolveApiMediaUrl(url)
      : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  const res = await fetch(absolute);
  if (!res.ok) {
    throw new Error(`Failed to fetch file (${res.status}): ${absolute}`);
  }
  const blob = await res.blob();
  const type = blob.type || "image/svg+xml";
  return new File([blob], filename, { type });
}

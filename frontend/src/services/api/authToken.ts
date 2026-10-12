import { getAuthConfig } from "../../auth/authConfig";

type AccessTokenGetter = () => string | null;

let accessTokenGetter: AccessTokenGetter | null = null;

export function setApiAccessTokenGetter(getter: AccessTokenGetter | null): void {
  accessTokenGetter = getter;
}

function buildOidcUserStorageKey(): string | null {
  const { oidcAuthority, oidcClientId } = getAuthConfig();
  const authority = oidcAuthority?.trim();
  if (!authority) {
    return null;
  }
  return `oidc.user:${authority}:${oidcClientId}`;
}

function readOidcAccessTokenFromStorage(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  const key = buildOidcUserStorageKey();
  if (!key) {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    if (typeof parsed.access_token === "string" && parsed.access_token.length > 0) {
      return parsed.access_token;
    }
  } catch {
    return null;
  }
  return null;
}

export function getApiAccessToken(): string | null {
  const fromGetter = accessTokenGetter?.() ?? null;
  if (fromGetter) {
    return fromGetter;
  }
  return readOidcAccessTokenFromStorage();
}

export function getApiAuthHeaders(): Record<string, string> {
  const token = getApiAccessToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * OIDC redirect_uri must match the page origin AND be registered in Identity Server.
 * In dev, prefer the current origin so sign-in works when Vite uses another port.
 */
export function resolveOidcRedirectUri(configured?: string): string {
  if (typeof window === "undefined") {
    return configured ?? "http://localhost:3000";
  }

  const currentOrigin = window.location.origin;

  if (!configured?.trim()) {
    return currentOrigin;
  }

  try {
    const configuredOrigin = new URL(configured).origin;
    if (configuredOrigin !== currentOrigin) {
      console.warn(
        `[Auth] VITE_APP_AUTH_REDIRECT_URI (${configuredOrigin}) does not match ` +
          `current origin (${currentOrigin}). Using ${currentOrigin} for this session. ` +
          `Register this redirect URI in Identity Server if login fails.`
      );
      return currentOrigin;
    }
    return configured.trim();
  } catch {
    return currentOrigin;
  }
}

let cachedDevMode: boolean | null = null;
export function isDevMode(): boolean {
    if (cachedDevMode === null) {
        cachedDevMode = import.meta.env.VITE_DEV_MODE === 'true';
    }
    return cachedDevMode;
}
export type AuthMode = 'dev' | 'oidc';
export interface AuthConfig {
    mode: AuthMode;
    oidcAuthority?: string;
    oidcRedirectUri?: string;
    oidcClientId: string;
    oidcScope: string;
}
export function getAuthMode(): AuthMode {
    if (isDevMode()) {
        return 'dev';
    }
    return 'oidc';
}
export class AuthConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthConfigError';
    }
}
function validateOidcConfig(authority?: string, redirectUri?: string): void {
    const missing: string[] = [];
    if (!authority) {
        missing.push('VITE_APP_AUTH_AUTHORITY');
    }
    if (!redirectUri) {
        missing.push('VITE_APP_AUTH_REDIRECT_URI');
    }
    if (missing.length > 0) {
        throw new AuthConfigError(`OIDC mode is enabled but required environment variables are missing:\n\n` +
            missing.map(v => `  - ${v}`).join('\n') + '\n\n' +
            `Please set these values in your .env file or switch to DEV mode by setting:\n` +
            `  VITE_DEV_MODE=true\n\n` +
            `See README.md for more information.`);
    }
}
export function getAuthConfig(): AuthConfig {
    const mode = getAuthMode();
    const authority = import.meta.env.VITE_APP_AUTH_AUTHORITY;
    const redirectUri = import.meta.env.VITE_APP_AUTH_REDIRECT_URI;
    const clientId = import.meta.env.VITE_APP_AUTH_CLIENT_ID ?? 'leobit.quest.web';
    const scope =
        import.meta.env.VITE_APP_AUTH_SCOPE ?? 'openid profile';
    const config: AuthConfig = {
        mode,
        oidcAuthority: authority,
        oidcRedirectUri: redirectUri,
        oidcClientId: clientId,
        oidcScope: scope,
    };
    if (mode === 'oidc') {
        validateOidcConfig(authority, redirectUri);
    }
    if (isDevMode()) {
        console.log(`[Auth] Mode: ${mode.toUpperCase()}`);
        if (mode === 'dev') {
            console.log('[Auth] Using DEV mode - authentication bypassed');
        } else {
            console.log(`[Auth] Using OIDC mode - authority: ${authority}, scope: ${scope}`);
        }
    }
    return config;
}

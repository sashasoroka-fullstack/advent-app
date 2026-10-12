import { UserManagerSettings, WebStorageStateStore } from "oidc-client-ts";
import { getAuthRedirectUri, getAuthority } from "../configUtils";
import { getAuthConfig } from "./authConfig";
import { resolveOidcRedirectUri } from "./resolveRedirectUri";

export function createOidcConfig(): UserManagerSettings {
    const { oidcAuthority, oidcRedirectUri, oidcClientId, oidcScope } = getAuthConfig();
    const authority = oidcAuthority ?? getAuthority();
    const redirectUri = resolveOidcRedirectUri(
        oidcRedirectUri ?? getAuthRedirectUri()
    );

    if (!authority || !redirectUri) {
        throw new Error("OIDC authority and redirect URI must be configured");
    }

    return {
        authority,
        client_id: oidcClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: oidcScope,
        automaticSilentRenew: true,
        loadUserInfo: true,
        userStore: new WebStorageStateStore({ store: localStorage }),
        post_logout_redirect_uri: redirectUri,
    };
}

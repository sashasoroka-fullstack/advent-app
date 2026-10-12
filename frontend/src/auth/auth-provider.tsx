import { ReactNode, useState, useEffect, useMemo } from "react";
import { AuthProvider as ReactOidcAuthProvider, useAuth } from "react-oidc-context";
import { createOidcConfig } from "./config";
import { MockAuthProvider } from "./dev-auth-provider";
import { AuthContextProvider, AuthState } from "./AuthContext";
import { ApiAuthSync } from "./ApiAuthSync";
import { OidcSessionBootstrap } from "./OidcSessionBootstrap";
import { getAuthConfig, AuthConfigError } from "./authConfig";
import { StatusScreen } from "../components/StatusScreen/StatusScreen";

const AuthConfigErrorDisplay: React.FC<{
    error: AuthConfigError;
}> = ({ error }) => (
    <StatusScreen
        variant="error"
        title="Authentication configuration error"
        message="The auth settings in the environment are invalid."
        details={error.message}
    />
);
const OidcAuthContextAdapter: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const oidcAuth = useAuth();
    const authState: AuthState = {
        isAuthenticated: oidcAuth.isAuthenticated,
        isAuthLoading: oidcAuth.isLoading,
        authMode: 'oidc',
        user: oidcAuth.user ?? null,
        error: oidcAuth.error,
        signIn: async (args?: {
            state?: unknown;
        }) => {
            await oidcAuth.signinRedirect(args);
        },
        signOut: async () => {
            await oidcAuth.signoutRedirect();
        },
    };
    return (
      <AuthContextProvider value={authState}>
        <ApiAuthSync user={authState.user} />
        <OidcSessionBootstrap>{children}</OidcSessionBootstrap>
      </AuthContextProvider>
    );
};

function onSigninCallback(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
}

export const AuthProvider: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const [configError, setConfigError] = useState<AuthConfigError | null>(null);
    const [authConfig, setAuthConfig] = useState<ReturnType<typeof getAuthConfig> | null>(null);
    const oidcConfig = useMemo(() => (authConfig?.mode === "oidc" ? createOidcConfig() : null), [authConfig?.mode]);
    useEffect(() => {
        try {
            const config = getAuthConfig();
            setAuthConfig(config);
        }
        catch (error) {
            if (error instanceof AuthConfigError) {
                setConfigError(error);
            }
            else {
                throw error;
            }
        }
    }, []);
    if (configError) {
        return <AuthConfigErrorDisplay error={configError}/>;
    }
    if (!authConfig) {
        return null;
    }
    if (authConfig.mode === 'dev') {
        return <MockAuthProvider>{children}</MockAuthProvider>;
    }
    if (!oidcConfig) {
        return null;
    }
    return (
      <ReactOidcAuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
        <OidcAuthContextAdapter>{children}</OidcAuthContextAdapter>
      </ReactOidcAuthProvider>
    );
};

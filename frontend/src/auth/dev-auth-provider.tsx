import React, { ReactNode } from "react";
import { User } from "oidc-client-ts";
import { AuthContextProvider, AuthState } from "./AuthContext";
import { resolvePrivilegedRoles } from "./userRole";
import { ApiAuthSync } from "./ApiAuthSync";
const createMockUser = (): User => {
    return {
        profile: {
            sub: "dev",
            email: "dev@leobit.com",
            name: "Dev User",
            role: resolvePrivilegedRoles()[0] ?? "dev-privileged",
        },
        id_token: "DEV_MOCK_ID_TOKEN",
        session_state: null,
        access_token: "DEV_MOCK_ACCESS_TOKEN",
        token_type: "Bearer",
        scope: "quest openid profile",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        expired: false,
        scopes: ["quest", "openid", "profile"],
        state: undefined,
        toStorageString: () => "",
    } as unknown as User;
};
export const MockAuthProvider: React.FC<{
    children: ReactNode;
}> = ({ children }) => {
    const mockUser = createMockUser();
    const authState: AuthState = {
        isAuthenticated: true,
        isAuthLoading: false,
        authMode: 'dev',
        user: mockUser,
        error: undefined,
        signIn: async () => {
            console.log("[DEV] Mock signIn called - already authenticated in DEV mode");
        },
        signOut: async () => {
            console.log("[DEV] Mock signOut called - reloading page");
            window.location.reload();
        },
    };
    return (
      <AuthContextProvider value={authState}>
        <ApiAuthSync user={authState.user} />
        {children}
      </AuthContextProvider>
    );
};

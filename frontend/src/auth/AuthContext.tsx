import { createContext, useContext, ReactNode } from 'react';
import { User } from 'oidc-client-ts';
import { AuthMode } from './authConfig';
export interface AuthState {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    authMode: AuthMode;
    user: User | null;
    error?: Error;
    signIn: (args?: {
        state?: unknown;
    }) => Promise<void>;
    signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export interface AuthContextProviderProps {
    children: ReactNode;
    value: AuthState;
}
export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children, value }) => {
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
export function useAuthContext(): AuthState {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider. ' +
            'Make sure your component is wrapped with AuthProvider in main.tsx');
    }
    return context;
}

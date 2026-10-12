# Authentication System Documentation

## Overview

The Well Being Quest application features a robust, dual-mode authentication system designed to work reliably in both development and production environments without redirect loops or configuration issues.

## Architecture

### Core Components

#### 1. AuthContext (`src/auth/AuthContext.tsx`)

The **centralized authentication state abstraction** that provides a consistent interface regardless of the auth mode.

```typescript
interface AuthState {
  isAuthenticated: boolean;      // User authentication status
  isAuthLoading: boolean;         // Auth state resolution in progress
  authMode: 'dev' | 'oidc';      // Current authentication mode
  user: User | null;              // Authenticated user object
  error?: Error;                  // Authentication error (if any)
  signIn: (args?) => Promise<void>;  // Sign in function
  signOut: () => Promise<void>;   // Sign out function
}
```

**Key Principle**: All components access auth state through `useAuthContext()` hook, never directly from OIDC provider.

#### 2. AuthConfig (`src/auth/authConfig.ts`)

Handles **authentication mode detection and configuration validation**.

**Functions**:
- `getAuthMode()`: Determines DEV or OIDC mode based on environment
- `getAuthConfig()`: Returns complete auth configuration with validation
- `validateOidcConfig()`: Validates required OIDC environment variables

**Mode Selection Logic** (`src/auth/authConfig.ts`):
```typescript
export function isDevMode(): boolean {
  return import.meta.env.VITE_DEV_MODE === "true";
}

export function getAuthMode(): AuthMode {
  if (isDevMode()) {
    return "dev";
  }
  return "oidc";
}
```

Vite `import.meta.env.DEV` does **not** switch auth. Only `VITE_DEV_MODE=true` does.

#### 3. AuthProvider (`src/auth/auth-provider.tsx`)

The **top-level authentication provider** that:
1. Detects authentication mode
2. Validates configuration
3. Sets up the appropriate provider (mock or OIDC)
4. Wraps everything in `AuthContextProvider`

**Flow**:
```
AuthProvider
  ├─ getAuthConfig()
  │   ├─ mode === 'dev' → MockAuthProvider → AuthContextProvider
  │   └─ mode === 'oidc' → ReactOidcAuthProvider → OidcAuthContextAdapter → AuthContextProvider
  └─ Configuration Error → AuthConfigErrorDisplay
```

#### 4. MockAuthProvider (`src/auth/dev-auth-provider.tsx`)

Provides **mock authentication for DEV mode** that mimics OIDC behavior:
- Always authenticated
- Mock user: `dev@leobit.com`
- No external dependencies
- Same interface as OIDC mode

#### 5. ProtectedRoute (`src/components/ProtectedRoute/ProtectedRoute.tsx`)

**Route guard** that ensures authentication before rendering protected content.

**Logic**:
```typescript
if (isAuthLoading) {
  return <LoadingSpinner />;  // Wait for auth resolution
}

if (!isAuthenticated) {
  navigate('/login?returnUrl=' + currentPath);  // Redirect to login
  return null;
}

return <>{children}</>;  // Render protected content
```

**Key Features**:
- Waits for auth state resolution before making decisions
- Preserves intended destination in `returnUrl`
- Uses `replace: true` to avoid history pollution
- Works identically in both DEV and OIDC modes

#### 6. Login Page (`src/pages/login/login.tsx`)

Handles **authentication flow** for both modes.

**Features**:
- Auto-initiates OIDC signin (once) when not authenticated
- Redirects to intended destination after successful auth
- Handles edge cases: page refresh, direct navigation, logout flow
- Uses ref guard to prevent multiple signin calls

## Authentication Modes

### DEV Mode

**Purpose**: Local development without external dependencies

**Characteristics**:
- ✅ Always authenticated
- ✅ No OIDC provider needed
- ✅ No network requests
- ✅ Instant authentication
- ✅ Mock user data

**Activation**:
```bash
VITE_DEV_MODE=true
npm run dev
```

**Use Cases**:
- Local development
- UI testing
- Feature development
- Component testing

### OIDC Mode

**Purpose**: Production authentication with real identity provider

**Characteristics**:
- ✅ Real OIDC authentication flow
- ✅ External identity provider
- ✅ Token-based authentication
- ✅ Session management
- ✅ Real user data

**Activation**:
```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-idp.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
```

**Requirements**:
- Valid OIDC authority URL
- Valid redirect URI
- Network access to identity provider

## Redirect Loop Prevention

### Problem

Redirect loops occur when multiple components trigger navigation simultaneously or before auth state is resolved:

```
User → /quest → ProtectedRoute → /login → Login → /quest → ProtectedRoute → /login ...
```

### Solution: Multi-Layered Prevention

#### 1. Auth State Resolution Guard

**Never redirect while auth state is loading**:

```typescript
useEffect(() => {
  if (isAuthLoading) return;  // ← Wait for resolution
  
  if (!isAuthenticated) {
    navigate('/login');
  }
}, [isAuthLoading, isAuthenticated]);
```

**Why it works**: Prevents premature decisions based on unknown auth state.

#### 2. Single Source of Truth

All components use `useAuthContext()` instead of directly accessing OIDC hooks:

```typescript
// ✅ Correct
const { isAuthenticated } = useAuthContext();

// ❌ Wrong
const { isAuthenticated } = useAuth(); // Direct OIDC access
```

**Why it works**: Ensures consistent auth state across the app.

#### 3. Ref-Based Signin Guard

Prevents multiple signin initiations:

```typescript
const hasInitiatedSignin = useRef(false);

if (!hasInitiatedSignin.current) {
  hasInitiatedSignin.current = true;
  signIn();
}
```

**Why it works**: Ref persists across renders but doesn't trigger re-renders.

#### 4. History Replacement

Uses `replace: true` to avoid polluting browser history:

```typescript
navigate('/login', { replace: true });
```

**Why it works**: Prevents back button loops.

#### 5. Conditional Redirects

Only redirect when necessary:

```typescript
if (!isAuthenticated && currentPath !== '/login') {
  navigate('/login');
}
```

**Why it works**: Prevents redirect loops when already on login page.

## Configuration Validation

### Runtime Validation

The system validates OIDC configuration at startup:

```typescript
function validateOidcConfig(authority?: string, redirectUri?: string) {
  if (!authority || !redirectUri) {
    throw new AuthConfigError(
      'OIDC mode requires VITE_APP_AUTH_AUTHORITY and VITE_APP_AUTH_REDIRECT_URI'
    );
  }
}
```

### Error Display

Invalid configuration shows a **clear error screen** instead of silent failure:

```
⚠️ Authentication Configuration Error

OIDC mode is enabled but required environment variables are missing:
  - VITE_APP_AUTH_AUTHORITY
  - VITE_APP_AUTH_REDIRECT_URI

Please set these values in your .env file or switch to DEV mode by setting:
  VITE_DEV_MODE=true
```

## Edge Cases Handled

### Page Refresh
- Auth state is restored from storage (OIDC mode)
- No re-authentication required
- User stays on current page

### Direct Navigation to Protected Route
- Route is captured in `returnUrl`
- User redirected to login
- After auth, user returned to intended route

### Logout → Login Flow
- Clean auth state
- No stale redirects
- Fresh authentication

### Network Failures (OIDC Mode)
- Error displayed on login page
- Retry mechanism available
- Clear error messages

## Migration Guide

### Using the New Auth System

**Old Way** (Direct OIDC access):
```typescript
import { useAuth } from 'react-oidc-context';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  // ...
}
```

**New Way** (Centralized auth context):
```typescript
import { useAuthContext } from '../auth/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAuthLoading } = useAuthContext();
  // ...
}
```

**Note**: `isLoading` is now `isAuthLoading` for clarity.

## Testing

### Testing in DEV Mode

```bash
npm run dev
# Navigate to http://localhost:3000
# You should be automatically authenticated as dev@leobit.com
# /quest should be accessible without login
```

### Testing in OIDC Mode

```bash
# Set up .env.local with real OIDC values
VITE_APP_AUTH_AUTHORITY=https://your-idp.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000

npm run dev
# Navigate to http://localhost:3000
# You should be redirected to OIDC provider
# After authentication, you should return to the app
```

### Testing Configuration Validation

```bash
# Set invalid config
VITE_APP_AUTH_AUTHORITY=https://your-idp.com
# (missing VITE_APP_AUTH_REDIRECT_URI)

npm run build
npm run preview
# Should show configuration error screen
```

## Troubleshooting

### Problem: Redirect Loop

**Symptoms**: Browser keeps navigating between `/login` and `/quest`

**Solutions**:
1. Check browser console for auth state logs
2. Verify `isAuthLoading` resolves to `false`
3. Clear browser storage: `localStorage.clear()`
4. Check for multiple auth providers in component tree

### Problem: Configuration Error Screen

**Symptoms**: Error screen on startup

**Solutions**:
1. Verify `.env.local` exists and has correct values
2. Check environment variable names (must start with `VITE_`)
3. Restart dev server after changing `.env.local`
4. For DEV mode: set `VITE_DEV_MODE=true`

### Problem: Not Authenticated in DEV Mode

**Symptoms**: Redirected to login in development

**Solutions**:
1. Ensure `VITE_DEV_MODE=true` in `.env.local`
2. Restart the dev server after changing env
3. Check browser console for `[Auth] Mode: DEV`
4. Verify `MockAuthProvider` is being used

## Best Practices

### Do ✅

- Use `useAuthContext()` in all components
- Wait for `isAuthLoading === false` before redirects
- Use `replace: true` for auth redirects
- Validate config early in app lifecycle
- Provide clear error messages

### Don't ❌

- Don't use `useAuth()` from `react-oidc-context` directly
- Don't redirect while `isAuthLoading === true`
- Don't trigger signin multiple times
- Don't assume auth state without checking `isAuthLoading`
- Don't mix auth logic across multiple components

## Future Enhancements

Potential improvements to the auth system:

1. **Additional Auth Modes**
   - OAuth2 (non-OIDC)
   - SAML
   - Custom token-based auth

2. **Enhanced Security**
   - PKCE support
   - Token refresh handling
   - Automatic logout on token expiry

3. **Better Testing**
   - Mock auth provider with configurable states
   - Test utilities for auth scenarios
   - Automated redirect loop detection

4. **Performance**
   - Lazy load OIDC library
   - Optimize re-renders
   - Cache auth state

## Summary

The authentication system is designed to be:

- **Robust**: No redirect loops, clear error handling
- **Flexible**: Works in DEV and OIDC modes seamlessly
- **Developer-Friendly**: Clear configuration, helpful errors
- **Maintainable**: Centralized state, consistent patterns
- **Reusable**: Easy to extend for new auth providers

By following the principles and patterns outlined in this document, the authentication flow remains stable and predictable across all environments and use cases.

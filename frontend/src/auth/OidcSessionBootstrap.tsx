import { useEffect, useState, ReactNode } from "react";
import { useAuth, hasAuthParams } from "react-oidc-context";
import PathsEnum from "../router/PathEnum";
import { logger } from "../utils/logger";
import { StatusScreen } from "../components/StatusScreen/StatusScreen";

function clearOidcQueryFromUrl(): void {
  const url = new URL(window.location.href);
  const keys = [
    "code",
    "state",
    "session_state",
    "iss",
    "error",
    "error_description",
  ];
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
}

/**
 * On app load: redirect to Identity Server when there is no session.
 */
export function OidcSessionBootstrap({ children }: { children: ReactNode }): ReactNode {
  const auth = useAuth();
  const [hasTriedSignin, setHasTriedSignin] = useState(false);

  useEffect(() => {
    if (auth.isLoading || auth.activeNavigator) return;
    if (auth.isAuthenticated) return;
    if (hasAuthParams()) return;
    if (hasTriedSignin) return;

    const { pathname, search } = window.location;
    const continueUri =
      pathname === PathsEnum.login || pathname === "/"
        ? PathsEnum.quest
        : pathname + search;

    logger.info("Auth", "Starting signinRedirect…", {
      authority: auth.settings.authority,
      client_id: auth.settings.client_id,
      redirect_uri: auth.settings.redirect_uri,
      scope: auth.settings.scope,
    });

    setHasTriedSignin(true);
    auth.signinRedirect({ state: { continueUri } }).catch((err) => {
      logger.error("Auth", "signinRedirect failed:", err);
      setHasTriedSignin(false);
    });
  }, [
    auth,
    auth.isLoading,
    auth.isAuthenticated,
    auth.activeNavigator,
    hasTriedSignin,
  ]);

  if (auth.activeNavigator === "signinRedirect") {
    return <AuthHold message="Redirecting to Leobit Identity…" />;
  }

  if (auth.activeNavigator === "signinSilent") {
    return <AuthHold message="Refreshing session…" />;
  }

  if (auth.isLoading || hasAuthParams()) {
    return <AuthHold message="Completing sign in…" />;
  }

  if (auth.error) {
    return (
      <AuthHold
        message={`Sign in failed: ${auth.error.message}`}
        detail={auth.error.toString()}
        variant="error"
        onRetry={() => {
          clearOidcQueryFromUrl();
          void auth.removeUser();
          setHasTriedSignin(false);
        }}
        retryLabel="Try again"
      />
    );
  }

  if (!auth.isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error_description") ?? params.get("error");
    if (urlError) {
      return (
        <AuthHold
          message={`Identity Server error: ${urlError}`}
          variant="error"
          onRetry={() => {
            clearOidcQueryFromUrl();
            setHasTriedSignin(false);
          }}
          retryLabel="Try again"
        />
      );
    }

    return (
      <AuthHold
        message="Redirecting to login…"
        variant="info"
        detail={
          hasTriedSignin
            ? "If this screen does not change, open DevTools → Console for [Auth] logs, or click Try again."
            : undefined
        }
        onRetry={
          hasTriedSignin
            ? () => {
                setHasTriedSignin(false);
              }
            : undefined
        }
        retryLabel="Try again"
      />
    );
  }

  return children;
}

function AuthHold({
  message,
  detail,
  onRetry,
  retryLabel = "Try again",
  variant = "loading",
}: {
  message: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "error" | "loading" | "info";
}): ReactNode {
  return (
    <StatusScreen
      variant={variant}
      message={message}
      details={detail}
      action={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
    />
  );
}

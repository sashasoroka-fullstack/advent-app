import { useEffect } from "react";
import { User } from "oidc-client-ts";
import { setApiAccessTokenGetter } from "../services/api/authToken";

export function ApiAuthSync({ user }: { user: User | null }) {
  useEffect(() => {
    setApiAccessTokenGetter(() => user?.access_token ?? null);
    return () => setApiAccessTokenGetter(null);
  }, [user?.access_token]);

  return null;
}

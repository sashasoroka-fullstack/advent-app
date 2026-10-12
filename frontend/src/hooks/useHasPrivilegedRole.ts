import { useMemo } from "react";
import { useAuthContext } from "../auth/AuthContext";
import { hasPrivilegedRole } from "../auth/userRole";

export function useHasPrivilegedRole(): boolean {
    const { user } = useAuthContext();
    return useMemo(() => hasPrivilegedRole(user), [user]);
}

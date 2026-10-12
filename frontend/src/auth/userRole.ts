import { User } from "oidc-client-ts";

const DEFAULT_ROLE_CLAIM_KEYS = ["role", "Role", "roles"];
function resolveRoleClaimKeys(): string[] {
    const configured = import.meta.env.VITE_APP_AUTH_ROLE_CLAIM?.trim();
    if (!configured) {
        return DEFAULT_ROLE_CLAIM_KEYS;
    }
    return configured
        .split(",")
        .map((key: string) => key.trim())
        .filter((key: string) => key.length > 0);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) {
            return null;
        }
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "=",
        );
        return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function collectRolesFromClaims(claims: Record<string, unknown>): string[] {
    const roles = new Set<string>();
    const keys = resolveRoleClaimKeys();
    for (const key of keys) {
        const value = claims[key];
        if (typeof value === "string" && value.trim()) {
            roles.add(value.trim());
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "string" && item.trim()) {
                    roles.add(item.trim());
                }
            }
        }
    }
    return [...roles];
}

export function getUserRoles(user: User | null | undefined): string[] {
    if (!user) {
        return [];
    }
    const roles = new Set<string>();
    if (user.profile && typeof user.profile === "object") {
        for (const role of collectRolesFromClaims(
            user.profile as Record<string, unknown>,
        )) {
            roles.add(role);
        }
    }
    if (user.access_token) {
        const payload = parseJwtPayload(user.access_token);
        if (payload) {
            for (const role of collectRolesFromClaims(payload)) {
                roles.add(role);
            }
        }
    }
    return [...roles];
}

export function resolvePrivilegedRoles(): string[] {
    const configured = import.meta.env.VITE_APP_AUTH_PRIVILEGED_ROLES?.trim();
    if (!configured) {
        return [];
    }
    return configured
        .split(",")
        .map((role: string) => role.trim())
        .filter((role: string) => role.length > 0);
}
export function hasPrivilegedRole(user: User | null | undefined): boolean {
    const privilegedRoles = resolvePrivilegedRoles();
    return getUserRoles(user).some((userRole) =>
        privilegedRoles.some(
            (privilegedRole) =>
                userRole.localeCompare(privilegedRole, undefined, {
                    sensitivity: "accent",
                }) === 0,
        ),
    );
}

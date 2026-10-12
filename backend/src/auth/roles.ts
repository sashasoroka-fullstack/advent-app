export const DEFAULT_PRIVILEGED_ROLES = ['HR'];

const DEFAULT_ROLE_CLAIM_KEYS = ['role', 'Role', 'roles'];

export function resolveRoleClaimKeys(
    configured?: string,
): string[] {
    if (!configured?.trim()) {
        return DEFAULT_ROLE_CLAIM_KEYS;
    }
    return configured
        .split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0);
}

export function extractRolesFromClaims(
    claims: Record<string, unknown>,
    claimKeys: string[],
): string[] {
    const roles = new Set<string>();
    for (const key of claimKeys) {
        const value = claims[key];
        if (typeof value === 'string' && value.trim()) {
            roles.add(value.trim());
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string' && item.trim()) {
                    roles.add(item.trim());
                }
            }
        }
    }
    return [...roles];
}

export function resolvePrivilegedRoles(
    configured?: string,
    legacySingleRole?: string,
): string[] {
    if (configured?.trim()) {
        return configured
            .split(',')
            .map((role) => role.trim())
            .filter((role) => role.length > 0);
    }
    if (legacySingleRole?.trim()) {
        return [legacySingleRole.trim()];
    }
    return [...DEFAULT_PRIVILEGED_ROLES];
}

export function hasPrivilegedRole(
    userRoles: string[],
    privilegedRoles: string[] = DEFAULT_PRIVILEGED_ROLES,
): boolean {
    return userRoles.some((userRole) =>
        privilegedRoles.some(
            (privilegedRole) =>
                userRole.localeCompare(privilegedRole, undefined, {
                    sensitivity: 'accent',
                }) === 0,
        ),
    );
}

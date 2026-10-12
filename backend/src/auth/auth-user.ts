export interface AuthUser {
    userId: string;
    email?: string;
    name?: string;
    roles: string[];
}

export function resolveCreatedBy(user: AuthUser): string {
    return user.email ?? user.name ?? user.userId;
}

import {
    extractRolesFromClaims,
    hasPrivilegedRole,
    resolvePrivilegedRoles,
} from './roles';

describe('roles helpers', () => {
    it('reads roles from string and array claims', () => {
        expect(
            extractRolesFromClaims(
                { role: 'HR', roles: ['Admin', '  '] },
                ['role', 'roles'],
            ),
        ).toEqual(['HR', 'Admin']);
    });

    it('matches privileged roles case-insensitively', () => {
        expect(hasPrivilegedRole(['hr'], ['HR'])).toBe(true);
        expect(hasPrivilegedRole(['User'], ['HR'])).toBe(false);
    });

    it('prefers AUTH_PRIVILEGED_ROLES over the legacy single role', () => {
        expect(resolvePrivilegedRoles('QuestManager, Admin', 'HR')).toEqual([
            'QuestManager',
            'Admin',
        ]);
        expect(resolvePrivilegedRoles(undefined, 'HR')).toEqual(['HR']);
        expect(resolvePrivilegedRoles(undefined, undefined)).toEqual(['HR']);
    });
});

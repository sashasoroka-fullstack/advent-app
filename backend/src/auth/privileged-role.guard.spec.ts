import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth-user';
import { PrivilegedRoleGuard } from './privileged-role.guard';
import { PrivilegedRolesService } from './privileged-roles.service';

function mockContext(user?: AuthUser) {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
    } as never;
}

describe('PrivilegedRoleGuard', () => {
    const reflector = {
        getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    const privilegedRolesService = {
        userHasPrivilegedRole: jest.fn(),
    } as unknown as PrivilegedRolesService;
    const guard = new PrivilegedRoleGuard(reflector, privilegedRolesService);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows routes that are not marked privileged-only', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

        expect(guard.canActivate(mockContext())).toBe(true);
        expect(
            privilegedRolesService.userHasPrivilegedRole as jest.Mock,
        ).not.toHaveBeenCalled();
    });

    it('rejects privileged routes without a user', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

        expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
    });

    it('rejects users without a privileged role', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
        (privilegedRolesService.userHasPrivilegedRole as jest.Mock).mockReturnValue(
            false,
        );
        const user: AuthUser = { userId: '1', roles: [] };

        expect(() => guard.canActivate(mockContext(user))).toThrow(
            ForbiddenException,
        );
    });

    it('allows privileged users', () => {
        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
        (privilegedRolesService.userHasPrivilegedRole as jest.Mock).mockReturnValue(
            true,
        );
        const user: AuthUser = { userId: '1', roles: ['HR'] };

        expect(guard.canActivate(mockContext(user))).toBe(true);
    });
});

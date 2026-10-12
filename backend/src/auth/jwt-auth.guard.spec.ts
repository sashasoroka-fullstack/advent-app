import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from './auth-user';
import { JwtAuthGuard } from './jwt-auth.guard';

function spyOnJwtParentCanActivate() {
    return jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');
}

function mockContext(request: { user?: AuthUser } = {}) {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as never;
}

describe('JwtAuthGuard', () => {
    const reflector = { getAllAndOverride: jest.fn() };
    const configService = { get: jest.fn() };
    let guard: JwtAuthGuard;

    beforeEach(() => {
        jest.clearAllMocks();
        guard = new JwtAuthGuard(
            reflector as unknown as Reflector,
            configService as unknown as ConfigService,
        );
    });

    it('bypasses JWT in non-production when auth is disabled', () => {
        configService.get.mockImplementation((key: string) => {
            if (key === 'auth.disabled') {
                return true;
            }
            if (key === 'app.nodeEnv') {
                return 'development';
            }
            return undefined;
        });
        const request: { user?: AuthUser } = {};

        expect(guard.canActivate(mockContext(request))).toBe(true);
        expect(request.user?.email).toBe('dev@local');
        expect(request.user?.roles).toContain('HR');
        expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
    });

    it('does not use the local bypass in production', () => {
        configService.get.mockImplementation((key: string) => {
            if (key === 'auth.disabled') {
                return true;
            }
            if (key === 'app.nodeEnv') {
                return 'production';
            }
            return undefined;
        });
        reflector.getAllAndOverride.mockReturnValue(false);
        const superSpy = spyOnJwtParentCanActivate().mockReturnValue(false);
        const request: { user?: AuthUser } = {};

        expect(guard.canActivate(mockContext(request))).toBe(false);
        expect(request.user).toBeUndefined();
        expect(superSpy).toHaveBeenCalled();
        superSpy.mockRestore();
    });

    it('allows @Public() routes without a token', () => {
        configService.get.mockReturnValue(false);
        reflector.getAllAndOverride.mockReturnValue(true);

        expect(guard.canActivate(mockContext())).toBe(true);
    });
});

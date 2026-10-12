import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from './auth-user';
import { IS_PUBLIC_KEY } from './auth.constants';
import { DEFAULT_PRIVILEGED_ROLES } from './roles';

const DEV_AUTH_USER: AuthUser = {
    userId: 'dev-local',
    email: 'dev@local',
    roles: [...DEFAULT_PRIVILEGED_ROLES],
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly reflector: Reflector,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isAuthDisabled =
            this.configService.get<boolean>('auth.disabled') === true;
        const isProduction =
            this.configService.get<string>('app.nodeEnv') === 'production';

        if (isAuthDisabled && !isProduction) {
            const request = context
                .switchToHttp()
                .getRequest<{ user?: AuthUser }>();
            request.user ??= DEV_AUTH_USER;
            return true;
        }
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
}

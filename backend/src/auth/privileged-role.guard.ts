import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth-user';
import { IS_PRIVILEGED_ONLY_KEY } from './privileged-only.decorator';
import { PrivilegedRolesService } from './privileged-roles.service';

@Injectable()
export class PrivilegedRoleGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly privilegedRolesService: PrivilegedRolesService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiresPrivilegedRole = this.reflector.getAllAndOverride<boolean>(
            IS_PRIVILEGED_ONLY_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiresPrivilegedRole) {
            return true;
        }
        const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
        const user = request.user;
        if (!user) {
            throw new ForbiddenException('Authentication required');
        }
        if (!this.privilegedRolesService.userHasPrivilegedRole(user.roles)) {
            throw new ForbiddenException('Privileged role required');
        }
        return true;
    }
}

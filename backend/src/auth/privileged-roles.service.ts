import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hasPrivilegedRole, resolvePrivilegedRoles } from './roles';

@Injectable()
export class PrivilegedRolesService {
    constructor(private readonly configService: ConfigService) {}

    getRoles(): string[] {
        return resolvePrivilegedRoles(
            this.configService.get<string>('auth.privilegedRoles'),
            this.configService.get<string>('auth.hrRole'),
        );
    }

    userHasPrivilegedRole(userRoles: string[]): boolean {
        return hasPrivilegedRole(userRoles, this.getRoles());
    }
}

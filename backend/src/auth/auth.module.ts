import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PrivilegedRoleGuard } from './privileged-role.guard';
import { PrivilegedRolesService } from './privileged-roles.service';

@Module({
    imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
    providers: [
        JwtStrategy,
        PrivilegedRolesService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: PrivilegedRoleGuard,
        },
    ],
    exports: [PrivilegedRolesService],
})
export class AuthModule {}

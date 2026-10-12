import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from './auth-user';
import {
    extractRolesFromClaims,
    resolveRoleClaimKeys,
} from './roles';

type IdentityJwtPayload = Record<string, unknown> & {
    sub?: string;
    email?: string;
    name?: string;
    preferred_username?: string;
    aud?: string | string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly audiences: string[];
    private readonly roleClaimKeys: string[];

    constructor(configService: ConfigService) {
        const issuer =
            configService.get<string>('auth.issuer') ??
            'https://test.identity.leobit.co';
        const audienceRaw = configService.get<string>('auth.audience') ?? '';
        const audiences = audienceRaw
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            issuer,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
                jwksUri: `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration/jwks`,
            }),
            audience: audiences.length > 0 ? audiences : undefined,
        });
        this.audiences = audiences;
        this.roleClaimKeys = resolveRoleClaimKeys(
            configService.get<string>('auth.roleClaim'),
        );
    }

    validate(payload: IdentityJwtPayload): AuthUser {
        if (!payload.sub) {
            throw new UnauthorizedException('Token is missing subject (sub)');
        }
        if (this.audiences.length > 0 && !this.matchesAudience(payload.aud)) {
            throw new UnauthorizedException('Token audience is not allowed');
        }
        const roles = extractRolesFromClaims(payload, this.roleClaimKeys);
        return {
            userId: payload.sub,
            email: typeof payload.email === 'string' ? payload.email : undefined,
            name:
                (typeof payload.name === 'string' ? payload.name : undefined) ??
                (typeof payload.preferred_username === 'string'
                    ? payload.preferred_username
                    : undefined),
            roles,
        };
    }

    private matchesAudience(aud: string | string[] | undefined): boolean {
        if (!aud) {
            return false;
        }
        const tokenAudiences = Array.isArray(aud) ? aud : [aud];
        return tokenAudiences.some((value) => this.audiences.includes(value));
    }
}

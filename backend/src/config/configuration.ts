import { registerAs } from '@nestjs/config';

function envFlag(value: string | undefined, defaultValue = false): boolean {
    if (value === undefined || value === '') {
        return defaultValue;
    }
    return value === 'true';
}

export const appConfig = registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3001', 10),
    corsOrigin: process.env.CORS_ORIGIN?.trim() || false,
}));

export const dbConfig = registerAs('db', () => ({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    synchronize: envFlag(process.env.DB_SYNCHRONIZE, false),
}));

export const authConfig = registerAs('auth', () => ({
    issuer: process.env.AUTH_ISSUER ?? 'https://test.identity.leobit.co',
    audience: process.env.AUTH_AUDIENCE ?? '',
    roleClaim: process.env.AUTH_ROLE_CLAIM ?? '',
    privilegedRoles: process.env.AUTH_PRIVILEGED_ROLES ?? '',
    hrRole: process.env.AUTH_HR_ROLE ?? '',
    disabled: envFlag(process.env.AUTH_DISABLED, false),
}));

export const mediaConfig = registerAs('media', () => ({
    storageRoot: process.env.MEDIA_STORAGE_ROOT ?? '',
    publicBaseUrl:
        process.env.MEDIA_PUBLIC_BASE_URL ?? process.env.APP_PUBLIC_URL ?? '',
    maxFileBytes:
        parseInt(process.env.MEDIA_MAX_FILE_BYTES ?? '0', 10) || undefined,
}));

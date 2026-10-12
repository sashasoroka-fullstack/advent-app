import Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().port().default(3001),
    CORS_ORIGIN: Joi.string().allow('').optional(),

    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(5432),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').required(),
    DB_NAME: Joi.string().required(),
    DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),

    MEDIA_STORAGE_ROOT: Joi.string().optional(),
    MEDIA_PUBLIC_BASE_URL: Joi.string().optional(),
    APP_PUBLIC_URL: Joi.string().optional(),
    MEDIA_MAX_FILE_BYTES: Joi.number().positive().optional(),

    AUTH_ISSUER: Joi.string()
        .uri()
        .default('https://test.identity.leobit.co'),
    AUTH_AUDIENCE: Joi.string().allow('').optional(),
    AUTH_DISABLED: Joi.boolean().truthy('true').falsy('false').default(false),
    AUTH_ROLE_CLAIM: Joi.string().optional(),
    AUTH_PRIVILEGED_ROLES: Joi.string().optional(),
    AUTH_HR_ROLE: Joi.string().optional(),
});

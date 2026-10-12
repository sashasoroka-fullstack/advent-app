import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import {
    appConfig,
    authConfig,
    dbConfig,
    mediaConfig,
} from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { QuestsModule } from './quests/quests.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            load: [appConfig, dbConfig, authConfig, mediaConfig],
            validationSchema: envValidationSchema,
            validationOptions: { abortEarly: false, allowUnknown: true },
        }),
        AuthModule,
        HealthModule,
        QuestsModule,
        MediaModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres' as const,
                host: config.get<string>('db.host'),
                port: config.get<number>('db.port') ?? 5432,
                username: config.get<string>('db.username'),
                password: config.get<string>('db.password'),
                database: config.get<string>('db.name'),
                autoLoadEntities: true,
                synchronize: config.get<boolean>('db.synchronize') === true,
            }),
        }),
    ],
})
export class AppModule {}

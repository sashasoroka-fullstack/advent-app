import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const corsOrigin = config.get<string | false>('app.corsOrigin') ?? false;
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Advent API')
        .setDescription('HTTP API for Advent (Well Being Quest)')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    const port = config.get<number>('app.port') ?? 3001;
    await app.listen(port);
    logger.log(`Listening on port ${port}`);
}

bootstrap().catch((err: unknown) => {
    const logger = new Logger('Bootstrap');
    logger.error(err instanceof Error ? err.stack ?? err.message : err);
    process.exit(1);
});

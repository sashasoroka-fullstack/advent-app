import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Options } from 'multer';
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
export const ALLOWED_MEDIA_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
]);
export function resolveMediaUploadRoot(config: ConfigService): string {
    const configured = config.get<string>('media.storageRoot');
    if (configured && configured.length > 0) {
        return join(process.cwd(), configured);
    }
    return join(process.cwd(), 'uploads', 'media');
}
export function resolveMediaMaxFileBytes(config: ConfigService): number {
    const value = config.get<number>('media.maxFileBytes');
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : DEFAULT_MAX_BYTES;
}
export function mediaMulterDiskStorage(uploadRoot: string) {
    return diskStorage({
        destination: (req, file, cb) => {
            mkdirSync(uploadRoot, { recursive: true });
            cb(null, uploadRoot);
        },
        filename: (req, file, cb) => {
            cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
    });
}
export function createMediaMulterOptions(config: ConfigService): Options {
    const uploadRoot = resolveMediaUploadRoot(config);
    return {
        storage: mediaMulterDiskStorage(uploadRoot),
        limits: { fileSize: resolveMediaMaxFileBytes(config) },
        fileFilter: (req, file, cb) => {
            if (ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
                cb(null, true);
                return;
            }
            cb(new BadRequestException(`Unsupported MIME type: ${file.mimetype}`));
        },
    };
}

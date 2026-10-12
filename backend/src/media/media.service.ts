import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, type ReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { MediaResponseDto } from './dto/media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';
import { resolveMediaUploadRoot } from './media-multer.config';

const SVG_MIME = 'image/svg+xml';

export type MediaFileStream = {
    stream: ReadStream;
    contentType: string;
    disposition: string;
};

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(Media)
        private readonly mediaRepository: Repository<Media>,
        private readonly configService: ConfigService,
    ) {}

    private getStorageRoot(): string {
        return resolveMediaUploadRoot(this.configService);
    }

    private getPublicBaseUrl(): string {
        const base = this.configService.get<string>('media.publicBaseUrl') ?? '';
        return base.replace(/\/+$/, '');
    }

    resolveAbsolutePath(media: Media): string {
        return join(this.getStorageRoot(), media.storageKey);
    }

    toPublicView(media: Media): MediaResponseDto {
        const base = this.getPublicBaseUrl();
        const path = `/media/${media.id}/file`;
        const url = base ? `${base}${path}` : path;
        return {
            id: media.id,
            originalFilename: media.originalFilename,
            mimeType: media.mimeType,
            sizeBytes: media.sizeBytes,
            width: media.width,
            height: media.height,
            altText: media.altText,
            url,
            createdBy: media.createdBy,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt,
        };
    }

    openFileStream(media: Media): MediaFileStream {
        const filename = encodeURIComponent(media.originalFilename);
        const disposition =
            media.mimeType === SVG_MIME
                ? `attachment; filename="${filename}"`
                : `inline; filename="${filename}"`;
        return {
            stream: createReadStream(this.resolveAbsolutePath(media)),
            contentType: media.mimeType,
            disposition,
        };
    }

    async createFromUploadedFile(
        file: Express.Multer.File | undefined,
        altText: string | undefined,
        createdBy: string,
    ): Promise<MediaResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        const entity = this.mediaRepository.create({
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storageKey: file.filename,
            width: null,
            height: null,
            altText: altText?.trim() ? altText.trim() : null,
            createdBy,
        });
        const saved = await this.mediaRepository.save(entity);
        return this.toPublicView(saved);
    }

    async findAll(): Promise<MediaResponseDto[]> {
        const rows = await this.mediaRepository.find({
            order: { createdAt: 'DESC' },
        });
        return rows.map((m) => this.toPublicView(m));
    }

    async findOne(id: string): Promise<MediaResponseDto> {
        const media = await this.findOneEntity(id);
        return this.toPublicView(media);
    }

    async findOneEntity(id: string): Promise<Media> {
        const media = await this.mediaRepository.findOne({ where: { id } });
        if (!media) {
            throw new NotFoundException('Media not found');
        }
        return media;
    }

    async update(id: string, dto: UpdateMediaDto): Promise<MediaResponseDto> {
        const media = await this.findOneEntity(id);
        if (dto.altText !== undefined) {
            media.altText =
                dto.altText === null || dto.altText === '' ? null : dto.altText;
        }
        if (dto.originalFilename !== undefined) {
            media.originalFilename = dto.originalFilename;
        }
        const saved = await this.mediaRepository.save(media);
        return this.toPublicView(saved);
    }

    async remove(id: string): Promise<void> {
        const media = await this.findOneEntity(id);
        await this.safeUnlink(this.resolveAbsolutePath(media));
        await this.mediaRepository.delete(id);
    }

    private async safeUnlink(path: string): Promise<void> {
        try {
            await unlink(path);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Could not delete media file at ${path}: ${message}`);
        }
    }
}

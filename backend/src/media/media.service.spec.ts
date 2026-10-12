import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { Media } from './entities/media.entity';
import { NotFoundException } from '@nestjs/common';
describe('MediaService', () => {
    let service: MediaService;
    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
    };
    const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediaService,
                { provide: getRepositoryToken(Media), useValue: mockRepository },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(MediaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('findOne should throw when missing', async () => {
        mockRepository.findOne.mockResolvedValue(null);
        await expect(service.findOne('00000000-0000-4000-8000-000000000001')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findOne returns a public view for an existing file', async () => {
        const now = new Date('2026-01-01T00:00:00.000Z');
        mockRepository.findOne.mockResolvedValue({
            id: '00000000-0000-4000-8000-000000000001',
            originalFilename: 'map.svg',
            mimeType: 'image/svg+xml',
            sizeBytes: 12,
            storageKey: 'abc.svg',
            width: null,
            height: null,
            altText: null,
            createdBy: 'hr@leobit.co',
            createdAt: now,
            updatedAt: now,
        });

        const result = await service.findOne('00000000-0000-4000-8000-000000000001');

        expect(result.url).toBe('/media/00000000-0000-4000-8000-000000000001/file');
        expect(result.originalFilename).toBe('map.svg');
        expect(result.createdBy).toBe('hr@leobit.co');
    });
});

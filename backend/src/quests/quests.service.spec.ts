import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { AuthUser } from 'src/auth/auth-user';
import { PrivilegedRolesService } from 'src/auth/privileged-roles.service';
import { MediaService } from 'src/media/media.service';
import { Quest } from './entities/quest.entity';
import { QuestStep } from './entities/quest-step.entity';
import { QuestsService } from './quests.service';

const privilegedUser: AuthUser = {
    userId: 'hr-1',
    email: 'hr@leobit.co',
    roles: ['HR'],
};

const regularUser: AuthUser = {
    userId: 'user-1',
    email: 'user@leobit.co',
    roles: [],
};

function makeQuest(overrides: Partial<Quest> = {}): Quest {
    return {
        id: 1,
        name: 'Well Being',
        slug: 'well-being',
        backgroundMediaId: null,
        backgroundMedia: null,
        mapMediaId: null,
        mapMedia: null,
        googleSheetUrl: null,
        isActive: true,
        createdBy: 'hr@leobit.co',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        steps: [],
        ...overrides,
    } as Quest;
}

describe('QuestsService', () => {
    let service: QuestsService;
    const questRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };
    const questStepRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        merge: jest.fn(),
    };
    const privilegedRolesService = {
        userHasPrivilegedRole: jest.fn(),
    };
    const dataSource = {
        transaction: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        privilegedRolesService.userHasPrivilegedRole.mockImplementation(
            (roles: string[]) => roles.includes('HR'),
        );
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestsService,
                { provide: getRepositoryToken(Quest), useValue: questRepository },
                {
                    provide: getRepositoryToken(QuestStep),
                    useValue: questStepRepository,
                },
                { provide: MediaService, useValue: { findOneEntity: jest.fn() } },
                { provide: DataSource, useValue: dataSource },
                { provide: PrivilegedRolesService, useValue: privilegedRolesService },
            ],
        }).compile();
        service = module.get(QuestsService);
    });

    describe('getActiveQuest', () => {
        it('returns the mapped active quest', async () => {
            const quest = makeQuest();
            questRepository.findOne.mockResolvedValue(quest);

            const result = await service.getActiveQuest();

            expect(result.id).toBe(1);
            expect(result.name).toBe('Well Being');
            expect(result.isActive).toBe(true);
            expect(result.slug).toBe('well-being');
        });

        it('throws when no active quest exists', async () => {
            questRepository.findOne.mockResolvedValue(null);

            await expect(service.getActiveQuest()).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('getQuestById', () => {
        it('lets a regular user read the active quest', async () => {
            questRepository.findOne.mockResolvedValue(makeQuest({ isActive: true }));

            const result = await service.getQuestById(1, regularUser);

            expect(result.id).toBe(1);
        });

        it('blocks a regular user from an inactive quest', async () => {
            questRepository.findOne.mockResolvedValue(
                makeQuest({ isActive: false }),
            );

            await expect(
                service.getQuestById(1, regularUser),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('lets a privileged user read an inactive quest', async () => {
            questRepository.findOne.mockResolvedValue(
                makeQuest({ isActive: false }),
            );

            const result = await service.getQuestById(1, privilegedUser);

            expect(result.isActive).toBe(false);
        });
    });

    describe('setActiveQuest', () => {
        it('deactivates current quest then activates the chosen one', async () => {
            const quest = makeQuest({ id: 2, isActive: false });
            questRepository.findOne
                .mockResolvedValueOnce(quest)
                .mockResolvedValueOnce(makeQuest({ id: 2, isActive: true }));
            const manager = { update: jest.fn().mockResolvedValue(undefined) };
            dataSource.transaction.mockImplementation(async (work) => work(manager));

            const result = await service.setActiveQuest(2, privilegedUser);

            expect(dataSource.transaction).toHaveBeenCalledTimes(1);
            expect(manager.update).toHaveBeenNthCalledWith(
                1,
                Quest,
                { isActive: true },
                { isActive: false },
            );
            expect(manager.update).toHaveBeenNthCalledWith(
                2,
                Quest,
                { id: 2 },
                { isActive: true },
            );
            expect(result.id).toBe(2);
            expect(result.isActive).toBe(true);
        });

        it('rejects a regular user', async () => {
            await expect(
                service.setActiveQuest(1, regularUser),
            ).rejects.toBeInstanceOf(ForbiddenException);
            expect(questRepository.findOne).not.toHaveBeenCalled();
        });
    });
});

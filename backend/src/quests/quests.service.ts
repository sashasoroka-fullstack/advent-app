import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { slugify } from 'src/common/utils';
import { MediaService } from 'src/media/media.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { QuestResponseDto } from './dto/quest-response.dto';
import { QuestStepResponseDto } from './dto/quest-step-response.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Quest } from './entities/quest.entity';
import { QuestStep } from './entities/quest-step.entity';
import { DataSource, Repository } from 'typeorm';
import type { MediaResponseDto } from 'src/media/dto/media-response.dto';
import { Media } from 'src/media/entities/media.entity';
import { AuthUser, resolveCreatedBy } from 'src/auth/auth-user';
import { PrivilegedRolesService } from 'src/auth/privileged-roles.service';
@Injectable()
export class QuestsService {
    constructor(
        @InjectRepository(Quest)
        private questRepository: Repository<Quest>,
        @InjectRepository(QuestStep)
        private questStepRepository: Repository<QuestStep>,
        private readonly mediaService: MediaService,
        private readonly dataSource: DataSource,
        private readonly privilegedRolesService: PrivilegedRolesService,
    ) {}
    async getAllQuests(user: AuthUser) {
        this.assertPrivilegedRole(user);
        const quests = await this.questRepository.find({
            relations: { backgroundMedia: true, mapMedia: true },
            order: { isActive: 'DESC', id: 'ASC' },
        });
        return quests.map((q) => this.toQuestResponse(q));
    }

    async getActiveQuest() {
        const quest = await this.questRepository.findOne({
            where: { isActive: true },
            relations: {
                backgroundMedia: true,
                mapMedia: true,
                steps: { iconMedia: true },
            },
            order: { steps: { taskNumber: 'ASC' } },
        });
        if (!quest) {
            throw new NotFoundException('No active quest configured');
        }
        return this.toQuestResponse(quest);
    }

    async getQuestById(id: number, user: AuthUser) {
        const quest = await this.questRepository.findOne({
            where: { id },
            relations: {
                backgroundMedia: true,
                mapMedia: true,
                steps: { iconMedia: true },
            },
            order: { steps: { taskNumber: 'ASC' } },
        });
        if (!quest) {
            throw new NotFoundException('Quest not found');
        }
        if (
            !this.privilegedRolesService.userHasPrivilegedRole(user.roles) &&
            !quest.isActive
        ) {
            throw new ForbiddenException(
                'Only the active quest is available to your role',
            );
        }
        return this.toQuestResponse(quest);
    }

    async setActiveQuest(id: number, user: AuthUser) {
        this.assertPrivilegedRole(user);
        const quest = await this.questRepository.findOne({ where: { id } });
        if (!quest) {
            throw new NotFoundException('Quest not found');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.update(Quest, { isActive: true }, { isActive: false });
            await manager.update(Quest, { id }, { isActive: true });
        });
        return this.getQuestById(id, user);
    }
    async createQuest(body: CreateQuestDto, user: AuthUser) {
        this.assertPrivilegedRole(user);
        await this.validateOptionalMediaRefs(body);
        const newQuest = this.questRepository.create({
            name: body.name,
            slug: slugify(body.name),
            backgroundMediaId: body.backgroundMediaId ?? null,
            mapMediaId: body.mapMediaId ?? null,
            googleSheetUrl: body.googleSheetUrl?.trim() || null,
            createdBy: resolveCreatedBy(user),
        });
        const saved = await this.questRepository.save(newQuest);
        return this.getQuestById(saved.id, user);
    }
    async updateQuest(id: number, body: UpdateQuestDto, user: AuthUser) {
        this.assertPrivilegedRole(user);
        const questToUpdate = await this.questRepository.findOne({ where: { id } });
        if (!questToUpdate) {
            throw new NotFoundException('Quest not found');
        }
        await this.validateOptionalMediaRefs(body);
        if (body.name !== undefined) {
            questToUpdate.name = body.name;
            questToUpdate.slug = slugify(body.name);
        }
        if (body.backgroundMediaId !== undefined) {
            questToUpdate.backgroundMediaId = body.backgroundMediaId ?? null;
        }
        if (body.mapMediaId !== undefined) {
            questToUpdate.mapMediaId = body.mapMediaId ?? null;
        }
        if (body.googleSheetUrl !== undefined) {
            const trimmed = body.googleSheetUrl?.trim() ?? '';
            questToUpdate.googleSheetUrl = trimmed === '' ? null : trimmed;
        }
        await this.questRepository.save(questToUpdate);
        return this.getQuestById(id, user);
    }
    async deleteQuest(id: number, user: AuthUser) {
        this.assertPrivilegedRole(user);
        const questToDelete = await this.questRepository.findOne({ where: { id } });
        if (!questToDelete) {
            throw new NotFoundException('Quest not found');
        }
        await this.questRepository.delete(id);
    }
    async createQuestStep(questId: number, body: CreateStepDto, user: AuthUser) {
        this.assertPrivilegedRole(user);
        const quest = await this.questRepository.findOne({
            where: { id: questId },
        });
        if (!quest) {
            throw new NotFoundException('Quest not found');
        }
        if (body.iconMediaId !== undefined && body.iconMediaId !== null) {
            await this.assertMediaExists(body.iconMediaId);
        }
        const newQuestStep = this.questStepRepository.create({
            taskNumber: body.taskNumber,
            label: body.label ?? null,
            color: body.color ?? null,
            cyStep: body.cyStep,
            cxStep: body.cxStep,
            iconMediaId: body.iconMediaId ?? null,
            size: body.size,
            quest,
        });
        const saved = await this.questStepRepository.save(newQuestStep);
        const loaded = await this.questStepRepository.findOne({
            where: { id: saved.id },
            relations: { iconMedia: true },
        });
        if (!loaded) {
            throw new NotFoundException('Quest step not found after create');
        }
        return this.toStepResponse(loaded);
    }
    async deleteQuestStep(questId: number, stepId: number, user: AuthUser) {
        this.assertPrivilegedRole(user);
        const step = await this.questStepRepository.findOne({
            where: { id: stepId, quest: { id: questId } },
            relations: { quest: true },
        });
        if (!step) {
            throw new NotFoundException('Quest step not found');
        }
        await this.questStepRepository.delete(stepId);
    }
    async updateQuestStep(
        questId: number,
        stepId: number,
        body: UpdateStepDto,
        user: AuthUser,
    ) {
        this.assertPrivilegedRole(user);
        const step = await this.questStepRepository.findOne({
            where: { id: stepId, quest: { id: questId } },
            relations: { quest: true },
        });
        if (!step) {
            throw new NotFoundException('Quest step not found');
        }
        if (body.iconMediaId !== undefined && body.iconMediaId !== null) {
            await this.assertMediaExists(body.iconMediaId);
        }
        const updates = this.buildQuestStepUpdate(body);
        this.questStepRepository.merge(step, updates);
        const saved = await this.questStepRepository.save(step);
        const loaded = await this.questStepRepository.findOne({
            where: { id: saved.id },
            relations: { iconMedia: true },
        });
        if (!loaded) {
            throw new NotFoundException('Quest step not found after update');
        }
        return this.toStepResponse(loaded);
    }
    private buildQuestStepUpdate(body: UpdateStepDto): Partial<QuestStep> {
        const updates: Partial<QuestStep> = {};
        if (body.taskNumber !== undefined)
            updates.taskNumber = body.taskNumber;
        if (body.cyStep !== undefined)
            updates.cyStep = body.cyStep;
        if (body.cxStep !== undefined)
            updates.cxStep = body.cxStep;
        if (body.size !== undefined)
            updates.size = body.size;
        if (body.label !== undefined)
            updates.label = body.label ?? null;
        if (body.color !== undefined)
            updates.color = body.color ?? null;
        if (body.iconMediaId !== undefined)
            updates.iconMediaId = body.iconMediaId ?? null;
        return updates;
    }
    async getQuestStep(questId: number, stepId: number, user: AuthUser) {
        if (!this.privilegedRolesService.userHasPrivilegedRole(user.roles)) {
            await this.assertQuestIsActive(questId);
        }
        const step = await this.questStepRepository.findOne({
            where: { id: stepId, quest: { id: questId } },
            relations: { quest: true, iconMedia: true },
        });
        if (!step) {
            throw new NotFoundException('Quest step not found');
        }
        return this.toStepResponse(step);
    }
    async getQuestSteps(questId: number, user: AuthUser) {
        const questExists = await this.questRepository.findOne({
            where: { id: questId },
        });
        if (!questExists) {
            throw new NotFoundException('Quest not found');
        }
        if (!this.privilegedRolesService.userHasPrivilegedRole(user.roles)) {
            await this.assertQuestIsActive(questId);
        }
        const rows = await this.questStepRepository.find({
            where: { quest: { id: questId } },
            relations: { iconMedia: true },
            order: { taskNumber: 'ASC' },
        });
        return rows.map((s) => this.toStepResponse(s));
    }
    private toQuestResponse(quest: Quest): QuestResponseDto {
        const row: QuestResponseDto = {
            id: quest.id,
            name: quest.name,
            slug: quest.slug,
            backgroundMediaId: quest.backgroundMediaId,
            backgroundMedia: this.mapMediaOrNull(quest.backgroundMedia),
            mapMediaId: quest.mapMediaId,
            mapMedia: this.mapMediaOrNull(quest.mapMedia),
            googleSheetUrl: quest.googleSheetUrl,
            isActive: quest.isActive,
            createdBy: quest.createdBy,
            createdAt: quest.createdAt,
            updatedAt: quest.updatedAt,
        };
        if (Array.isArray(quest.steps)) {
            row.steps = quest.steps.map((s) => this.toStepResponse(s));
        }
        return row;
    }
    private toStepResponse(step: QuestStep): QuestStepResponseDto {
        return {
            id: step.id,
            taskNumber: step.taskNumber,
            label: step.label,
            color: step.color,
            cyStep: step.cyStep,
            cxStep: step.cxStep,
            iconMediaId: step.iconMediaId,
            iconMedia: this.mapMediaOrNull(step.iconMedia),
            size: step.size,
            createdAt: step.createdAt,
            updatedAt: step.updatedAt,
        };
    }
    private mapMediaOrNull(media: Media | null): MediaResponseDto | null {
        if (!media) {
            return null;
        }
        return this.mediaService.toPublicView(media);
    }
    private async validateOptionalMediaRefs(body: {
        backgroundMediaId?: string | null;
        mapMediaId?: string | null;
    }): Promise<void> {
        if (body.backgroundMediaId != null) {
            await this.assertMediaExists(body.backgroundMediaId);
        }
        if (body.mapMediaId != null) {
            await this.assertMediaExists(body.mapMediaId);
        }
    }
    private async assertMediaExists(mediaId: string): Promise<void> {
        await this.mediaService.findOneEntity(mediaId);
    }

    private assertPrivilegedRole(user: AuthUser): void {
        if (!this.privilegedRolesService.userHasPrivilegedRole(user.roles)) {
            throw new ForbiddenException('Privileged role required');
        }
    }

    private async assertQuestIsActive(questId: number): Promise<void> {
        const active = await this.questRepository.findOne({
            where: { isActive: true },
            select: { id: true },
        });
        if (!active || active.id !== questId) {
            throw new ForbiddenException(
                'Only the active quest is available to your role',
            );
        }
    }
}

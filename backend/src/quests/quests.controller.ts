import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { AuthUser } from 'src/auth/auth-user';
import { PrivilegedOnly } from 'src/auth/privileged-only.decorator';
import { CreateQuestDto } from './dto/create-quest.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { QuestResponseDto } from './dto/quest-response.dto';
import { QuestStepResponseDto } from './dto/quest-step-response.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { QuestsService } from './quests.service';

@ApiTags('quests')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller('quest')
export class QuestsController {
    constructor(private questsService: QuestsService) {}

    @Get('active')
    @ApiOperation({ summary: 'Get the active quest' })
    @ApiOkResponse({ type: QuestResponseDto })
    @ApiNotFoundResponse({ description: 'No active quest configured' })
    getActiveQuest() {
        return this.questsService.getActiveQuest();
    }

    @Get()
    @PrivilegedOnly()
    @ApiOperation({ summary: 'List all quests' })
    @ApiOkResponse({ type: QuestResponseDto, isArray: true })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    getAllQuests(@CurrentUser() user: AuthUser) {
        return this.questsService.getAllQuests(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a quest by id' })
    @ApiOkResponse({ type: QuestResponseDto })
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({
        description: 'Non-privileged users may only read the active quest',
    })
    getQuestById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.getQuestById(id, user);
    }

    @Post()
    @PrivilegedOnly()
    @ApiOperation({ summary: 'Create a quest' })
    @ApiCreatedResponse({ type: QuestResponseDto })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    createQuest(
        @Body() body: CreateQuestDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.createQuest(body, user);
    }

    @Put(':id/select')
    @PrivilegedOnly()
    @ApiOperation({ summary: 'Make this quest the active one' })
    @ApiOkResponse({ type: QuestResponseDto })
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    selectQuest(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.setActiveQuest(id, user);
    }

    @Put(':id')
    @PrivilegedOnly()
    @ApiOperation({ summary: 'Update a quest' })
    @ApiOkResponse({ type: QuestResponseDto })
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    updateQuest(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateQuestDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.updateQuest(id, body, user);
    }

    @Delete(':id')
    @PrivilegedOnly()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a quest' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    deleteQuest(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.deleteQuest(id, user);
    }

    @Get(':questId/steps')
    @ApiOperation({ summary: 'List steps for a quest' })
    @ApiOkResponse({ type: QuestStepResponseDto, isArray: true })
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({
        description: 'Non-privileged users may only read the active quest',
    })
    getQuestSteps(
        @Param('questId', ParseIntPipe) questId: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.getQuestSteps(questId, user);
    }

    @Get(':questId/steps/:stepId')
    @ApiOperation({ summary: 'Get one quest step' })
    @ApiOkResponse({ type: QuestStepResponseDto })
    @ApiNotFoundResponse({ description: 'Quest step not found' })
    @ApiForbiddenResponse({
        description: 'Non-privileged users may only read the active quest',
    })
    getQuestStep(
        @Param('questId', ParseIntPipe) questId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.getQuestStep(questId, stepId, user);
    }

    @Post(':questId/steps')
    @PrivilegedOnly()
    @ApiOperation({ summary: 'Create a quest step' })
    @ApiCreatedResponse({ type: QuestStepResponseDto })
    @ApiNotFoundResponse({ description: 'Quest not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    createQuestStep(
        @Param('questId', ParseIntPipe) questId: number,
        @Body() body: CreateStepDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.createQuestStep(questId, body, user);
    }

    @Put(':questId/steps/:stepId')
    @PrivilegedOnly()
    @ApiOperation({ summary: 'Update a quest step' })
    @ApiOkResponse({ type: QuestStepResponseDto })
    @ApiNotFoundResponse({ description: 'Quest step not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    updateQuestStep(
        @Param('questId', ParseIntPipe) questId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
        @Body() body: UpdateStepDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.updateQuestStep(
            questId,
            stepId,
            body,
            user,
        );
    }

    @Delete(':questId/steps/:stepId')
    @PrivilegedOnly()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a quest step' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ description: 'Quest step not found' })
    @ApiForbiddenResponse({ description: 'Privileged role required' })
    deleteQuestStep(
        @Param('questId', ParseIntPipe) questId: number,
        @Param('stepId', ParseIntPipe) stepId: number,
        @CurrentUser() user: AuthUser,
    ) {
        return this.questsService.deleteQuestStep(questId, stepId, user);
    }
}

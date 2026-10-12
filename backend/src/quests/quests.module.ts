import { Module } from '@nestjs/common';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MediaModule } from 'src/media/media.module';
import { Quest } from './entities/quest.entity';
import { QuestStep } from './entities/quest-step.entity';
@Module({
    imports: [
        TypeOrmModule.forFeature([Quest, QuestStep]),
        MediaModule,
        AuthModule,
    ],
    controllers: [QuestsController],
    providers: [QuestsService],
})
export class QuestsModule {
}

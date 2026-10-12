import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaResponseDto } from 'src/media/dto/media-response.dto';
import { QuestStepResponseDto } from './quest-step-response.dto';

export class QuestResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
    backgroundMediaId: string | null;

    @ApiPropertyOptional({ type: () => MediaResponseDto, nullable: true })
    backgroundMedia: MediaResponseDto | null;

    @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
    mapMediaId: string | null;

    @ApiPropertyOptional({ type: () => MediaResponseDto, nullable: true })
    mapMedia: MediaResponseDto | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    googleSheetUrl: string | null;

    @ApiProperty()
    isActive: boolean;

    @ApiPropertyOptional({ type: String, nullable: true })
    createdBy: string | null;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt: Date;

    @ApiPropertyOptional({ type: () => [QuestStepResponseDto] })
    steps?: QuestStepResponseDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaResponseDto } from 'src/media/dto/media-response.dto';

export class QuestStepResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    taskNumber: number;

    @ApiPropertyOptional({ type: String, nullable: true })
    label: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    color: string | null;

    @ApiProperty()
    cyStep: number;

    @ApiProperty()
    cxStep: number;

    @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
    iconMediaId: string | null;

    @ApiPropertyOptional({ type: () => MediaResponseDto, nullable: true })
    iconMedia: MediaResponseDto | null;

    @ApiProperty()
    size: string;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt: Date;
}

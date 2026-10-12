import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    originalFilename: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    sizeBytes: number;

    @ApiPropertyOptional({ type: Number, nullable: true })
    width: number | null;

    @ApiPropertyOptional({ type: Number, nullable: true })
    height: number | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    altText: string | null;

    @ApiProperty({ description: 'Public URL to download or view the file' })
    url: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    createdBy: string | null;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt: Date;
}

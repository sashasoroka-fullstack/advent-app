import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class UpdateMediaDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    altText?: string | null;
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(512)
    originalFilename?: string;
}

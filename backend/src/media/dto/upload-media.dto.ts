import { IsOptional, IsString, MaxLength } from 'class-validator';
export class UploadMediaDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    altText?: string;
}

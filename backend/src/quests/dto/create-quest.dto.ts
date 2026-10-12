import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, } from 'class-validator';
export class CreateQuestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    name: string;
    @IsOptional()
    @IsUUID('4')
    backgroundMediaId?: string;
    @IsOptional()
    @IsUUID('4')
    mapMediaId?: string;
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    googleSheetUrl?: string | null;
}

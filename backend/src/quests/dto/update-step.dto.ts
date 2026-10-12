import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, } from 'class-validator';
export class UpdateStepDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    taskNumber?: number;
    @IsOptional()
    @IsString()
    @MaxLength(255)
    label?: string | null;
    @IsOptional()
    @IsString()
    @MaxLength(64)
    color?: string | null;
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    cyStep?: number;
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    cxStep?: number;
    @IsOptional()
    @IsUUID('4')
    iconMediaId?: string | null;
    @IsOptional()
    @IsString()
    @MaxLength(64)
    size?: string;
}

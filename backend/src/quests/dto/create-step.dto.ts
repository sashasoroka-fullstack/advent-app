import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, } from 'class-validator';
export class CreateStepDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    taskNumber: number;
    @IsOptional()
    @IsString()
    @MaxLength(255)
    label?: string;
    @IsOptional()
    @IsString()
    @MaxLength(64)
    color?: string;
    @Type(() => Number)
    @IsNumber()
    cyStep: number;
    @Type(() => Number)
    @IsNumber()
    cxStep: number;
    @IsOptional()
    @IsUUID('4')
    iconMediaId?: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    size: string;
}

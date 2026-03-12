import { IsUUID, IsArray, ValidateNested, IsString, IsNumber, IsIn, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustmentDto {
  @IsIn(['other', 'bonus'])
  type!: 'other' | 'bonus';

  @IsNumber()
  amount!: number;

  @IsString()
  note!: string;
}

export class SalaryPreviewDto {
  @IsUUID()
  weekId!: string;
}

export class GenerateSalaryDto {
  @IsUUID()
  weekId!: string;

  @IsUUID()
  dispatcherId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentDto)
  adjustments!: AdjustmentDto[];
}

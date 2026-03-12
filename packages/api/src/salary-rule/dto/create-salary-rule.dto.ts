import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class TierRowDto {
  @IsInt()
  @Min(1)
  tierOrder!: number;

  @IsNumber()
  @Min(0)
  minProfit!: number;

  @IsOptional()
  @IsNumber()
  maxProfit!: number | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  percent!: number;
}

export class CreateSalaryRuleDto {
  @IsString()
  name!: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierRowDto)
  tiers!: TierRowDto[];
}

import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  MinLength,
  Min,
} from 'class-validator';
import { LoadStatus } from '@lol/shared';

export class CreateLoadDto {
  @IsString()
  @MinLength(1)
  sylNumber!: string;

  @IsOptional()
  @IsString()
  externalSource?: string | null;

  @IsOptional()
  @IsString()
  externalLoadKey?: string | null;

  @IsUUID()
  weekId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string | null;

  @IsOptional()
  @IsUUID()
  driverId?: string | null;

  @IsUUID()
  dispatcherId!: string;

  @IsString()
  @MinLength(1)
  businessName!: string;

  @IsOptional()
  @IsUUID()
  brokerageId?: string | null;

  @IsOptional()
  @IsString()
  netsuiteRef?: string | null;

  @IsString()
  @MinLength(1)
  fromAddress!: string;

  @IsString()
  @MinLength(1)
  fromState!: string;

  @IsDateString()
  fromDate!: string;

  @IsString()
  @MinLength(1)
  toAddress!: string;

  @IsString()
  @MinLength(1)
  toState!: string;

  @IsDateString()
  toDate!: string;

  @IsNumber()
  @Min(0)
  miles!: number;

  @IsNumber()
  @Min(0)
  grossAmount!: number;

  @IsNumber()
  @Min(0)
  driverCostAmount!: number;

  @IsOptional()
  @IsBoolean()
  quickPayFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  directPaymentFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  factoringFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  driverPaidFlag?: boolean;

  @IsOptional()
  @IsEnum(LoadStatus)
  loadStatus?: LoadStatus;

  @IsOptional()
  @IsString()
  comment?: string | null;
}

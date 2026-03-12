import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEmail,
  MinLength,
  Min,
} from 'class-validator';

/**
 * DTO for Cargo webhook inbound payload.
 * Validates the minimum contract before processing.
 */
export class CargoWebhookDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsString()
  @MinLength(1)
  loadKey!: string;

  @IsString()
  @MinLength(1)
  sylNumber!: string;

  @IsDateString()
  date!: string;

  @IsEmail()
  dispatcherEmail!: string;

  @IsString()
  @MinLength(1)
  businessName!: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  miles?: number;

  @IsNumber()
  @Min(0)
  grossAmount!: number;

  @IsNumber()
  @Min(0)
  driverCostAmount!: number;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  brokerageId?: string;

  @IsOptional()
  @IsString()
  netsuiteRef?: string;

  @IsOptional()
  @IsString()
  loadStatus?: string;

  @IsOptional()
  @IsString()
  comment?: string;

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
}

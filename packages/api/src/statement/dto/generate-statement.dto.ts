import { IsString, IsOptional, IsBoolean, IsUUID, IsIn } from 'class-validator';
import type { StatementType } from '@lol/shared';

export class GenerateStatementDto {
  @IsIn(['driver', 'owner'])
  statementType!: StatementType;

  @IsUUID()
  weekId!: string;

  @IsOptional()
  @IsString()
  paymentFilter?: string;

  @IsOptional()
  @IsBoolean()
  onlyUnpaid?: boolean;

  @IsOptional()
  @IsUUID()
  unitId?: string | null;
}

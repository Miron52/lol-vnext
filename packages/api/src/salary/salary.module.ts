import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRecord } from './entities/salary-record.entity';
import { SalaryWeekState } from './entities/salary-week-state.entity';
import { SalaryAuditLog } from './entities/salary-audit-log.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryRecord,
      SalaryWeekState,
      SalaryAuditLog,
      Load,
      Week,
      User,
      SalaryRule,
    ]),
    IdentityModule,
  ],
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],
})
export class SalaryModule {}

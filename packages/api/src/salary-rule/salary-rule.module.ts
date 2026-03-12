import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRule } from './entities/salary-rule.entity';
import { User } from '../identity/entities/user.entity';
import { SalaryRulesService } from './salary-rules.service';
import { SalaryRulesController } from './salary-rules.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryRule, User]),
    IdentityModule,
  ],
  controllers: [SalaryRulesController],
  providers: [SalaryRulesService],
  exports: [SalaryRulesService],
})
export class SalaryRuleModule {}

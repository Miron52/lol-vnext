import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Load, Week]), IdentityModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

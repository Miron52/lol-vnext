import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationEvent } from './entities/integration-event.entity';
import { IntegrationEventsService } from './integration-events.service';
import { CargoWebhookController } from './cargo-webhook.controller';
import { Load } from '../load/entities/load.entity';
import { User } from '../identity/entities/user.entity';
import { WeekModule } from '../week/week.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntegrationEvent, Load, User]),
    WeekModule,
  ],
  controllers: [CargoWebhookController],
  providers: [IntegrationEventsService],
  exports: [IntegrationEventsService],
})
export class IntegrationModule {}

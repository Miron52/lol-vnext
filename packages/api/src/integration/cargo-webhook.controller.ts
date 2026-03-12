import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CargoWebhookDto } from './dto/cargo-webhook.dto';
import { IntegrationEventsService } from './integration-events.service';
import { CargoWebhookPayload, IntegrationEventDto } from '@lol/shared';

/**
 * Inbound webhook endpoint for Cargo ETL.
 *
 * NOTE: No JWT auth guard — webhook endpoints use a different authentication
 * mechanism (e.g. shared secret header, IP allowlist). For v1, this endpoint
 * is unguarded. Webhook auth will be addressed in a follow-up ticket.
 */
@Controller('webhooks/cargo')
export class CargoWebhookController {
  private readonly logger = new Logger(CargoWebhookController.name);

  constructor(
    private readonly integrationEventsService: IntegrationEventsService,
  ) {}

  /**
   * POST /api/webhooks/cargo
   *
   * Accepts a Cargo webhook payload, persists as raw event, then processes
   * into a Load create/update. Returns the IntegrationEventDto with
   * processing status and result.
   *
   * Idempotent: repeated identical payloads return the original event
   * without creating duplicate loads.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async ingest(@Body() dto: CargoWebhookDto): Promise<IntegrationEventDto> {
    this.logger.log(
      `Cargo webhook received: loadKey=${dto.loadKey}, sylNumber=${dto.sylNumber}`,
    );

    const payload: CargoWebhookPayload = dto;
    return this.integrationEventsService.processCargoWebhook(payload);
  }
}

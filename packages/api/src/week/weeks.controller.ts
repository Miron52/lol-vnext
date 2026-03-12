import { Controller, Get, UseGuards } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { WeekDto } from '@lol/shared';

@Controller('weeks')
@UseGuards(JwtAuthGuard)
export class WeeksController {
  constructor(private readonly weeksService: WeeksService) {}

  /** GET /api/weeks — list all weeks, newest first. */
  @Get()
  async list(): Promise<WeekDto[]> {
    return this.weeksService.list();
  }

  /**
   * GET /api/weeks/current — resolve current ISO week.
   *
   * SIDE-EFFECT: if the row for the current ISO week does not yet exist
   * in the database, this endpoint creates it (idempotent upsert).
   * This is by design — weeks are created lazily on first access so no
   * background job or manual seeding is required.
   */
  @Get('current')
  async current(): Promise<WeekDto> {
    return this.weeksService.current();
  }
}

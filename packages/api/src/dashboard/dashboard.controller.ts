import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { DashboardDto } from '@lol/shared';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard?weekIds=uuid1,uuid2,uuid3
   *
   * Returns aggregated financials for the given weeks.
   * weekIds is a comma-separated list of week UUIDs.
   */
  @Get()
  async aggregate(@Query('weekIds') weekIds: string): Promise<DashboardDto> {
    const ids = (weekIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return this.dashboardService.aggregate(ids);
  }
}

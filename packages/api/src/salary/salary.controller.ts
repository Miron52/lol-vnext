import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { SalaryService } from './salary.service';
import { GenerateSalaryDto } from './dto/generate-salary.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import { Role } from '@lol/shared';
import type {
  SalaryRowDto,
  SalaryRecordDto,
  SalaryWeekStateDto,
  SalaryAuditLogDto,
} from '@lol/shared';

@Controller('salary')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Accountant, Role.Dispatcher)
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  /**
   * GET /api/salary/week-state?weekId=uuid
   * Returns the week's salary state (open / generated / frozen).
   */
  @Get('week-state')
  async getWeekState(
    @Query('weekId', ParseUUIDPipe) weekId: string,
  ): Promise<SalaryWeekStateDto> {
    return this.salaryService.getWeekState(weekId);
  }

  /**
   * GET /api/salary/preview?weekId=uuid
   * Returns salary rows for ALL dispatchers for a given week.
   */
  @Get('preview')
  async previewWeek(
    @Query('weekId', ParseUUIDPipe) weekId: string,
  ): Promise<SalaryRowDto[]> {
    return this.salaryService.previewWeek(weekId);
  }

  /**
   * GET /api/salary/audit-log?weekId=uuid
   * Returns the last 50 audit entries for the given week.
   */
  @Get('audit-log')
  async getAuditLog(
    @Query('weekId', ParseUUIDPipe) weekId: string,
  ): Promise<SalaryAuditLogDto[]> {
    return this.salaryService.getAuditLog(weekId);
  }

  /**
   * POST /api/salary/generate
   * Generate (persist) a salary record for a single dispatcher + week.
   */
  @Post('generate')
  @Roles(Role.Admin, Role.Accountant)
  async generate(
    @Body() dto: GenerateSalaryDto,
    @Req() req: any,
  ): Promise<SalaryRowDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryService.generate(
      dto.weekId,
      dto.dispatcherId,
      dto.adjustments,
      userId,
    );
  }

  /**
   * POST /api/salary/recalculate
   * Recalculate all generated salary records for a week using current loads.
   */
  @Post('recalculate')
  @Roles(Role.Admin, Role.Accountant)
  async recalculateWeek(
    @Body('weekId', ParseUUIDPipe) weekId: string,
    @Req() req: any,
  ): Promise<SalaryRowDto[]> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryService.recalculateWeek(weekId, userId);
  }

  /**
   * POST /api/salary/freeze
   * Freeze a week — no further changes allowed.
   */
  @Post('freeze')
  @Roles(Role.Admin, Role.Accountant)
  async freezeWeek(
    @Body('weekId', ParseUUIDPipe) weekId: string,
    @Req() req: any,
  ): Promise<SalaryWeekStateDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryService.freezeWeek(weekId, userId);
  }

  /**
   * POST /api/salary/unfreeze
   * Unfreeze a week — allows further modifications.
   */
  @Post('unfreeze')
  @Roles(Role.Admin, Role.Accountant)
  async unfreezeWeek(
    @Body('weekId', ParseUUIDPipe) weekId: string,
    @Req() req: any,
  ): Promise<SalaryWeekStateDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryService.unfreezeWeek(weekId, userId);
  }

  /**
   * GET /api/salary/:id
   * Fetch a single salary record with full snapshot.
   */
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalaryRecordDto> {
    return this.salaryService.findById(id);
  }
}

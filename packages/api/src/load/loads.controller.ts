import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import { Role, LoadDto } from '@lol/shared';

@Controller('loads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  /** GET /api/loads?weekId=uuid&includeArchived=true — list loads. */
  @Get()
  async list(
    @Query('weekId') weekId?: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<LoadDto[]> {
    return this.loadsService.list(weekId, includeArchived === 'true');
  }

  /**
   * GET /api/loads/export?weekId=uuid&paymentFilter=all&onlyUnpaid=false&excludeBrokers=false
   *
   * Returns a downloadable CSV file.
   * Must be defined BEFORE the :id route to avoid param collision.
   */
  @Get('export')
  @Roles(Role.Admin, Role.Accountant, Role.Dispatcher)
  async exportCsv(
    @Query('weekId') weekId: string,
    @Query('paymentFilter') paymentFilter?: string,
    @Query('onlyUnpaid') onlyUnpaid?: string,
    @Query('excludeBrokers') excludeBrokers?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const { csv, count } = await this.loadsService.exportCsv({
      weekId,
      paymentFilter: paymentFilter || 'all',
      onlyUnpaid: onlyUnpaid === 'true',
      excludeBrokers: excludeBrokers === 'true',
    });

    const filename = `loads-export-${weekId.substring(0, 8)}-${Date.now()}.csv`;

    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.setHeader('X-Export-Row-Count', String(count));
    res!.send(csv);
  }

  /** GET /api/loads/:id — single load by id. */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<LoadDto> {
    return this.loadsService.findById(id);
  }

  /** POST /api/loads — create a new load. */
  @Post()
  async create(@Body() dto: CreateLoadDto): Promise<LoadDto> {
    return this.loadsService.create(dto);
  }

  /** PATCH /api/loads/:id — partial update. Recomputes derived fields. */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoadDto,
  ): Promise<LoadDto> {
    return this.loadsService.update(id, dto);
  }

  /** POST /api/loads/:id/archive — soft-archive a load. */
  @Post(':id/archive')
  @Roles(Role.Admin, Role.Accountant)
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoadDto> {
    return this.loadsService.archive(id);
  }

  /** POST /api/loads/:id/unarchive — unarchive a load. */
  @Post(':id/unarchive')
  @Roles(Role.Admin, Role.Accountant)
  async unarchive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoadDto> {
    return this.loadsService.unarchive(id);
  }
}

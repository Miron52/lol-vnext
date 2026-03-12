import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { StatementsService } from './statements.service';
import { GenerateStatementDto } from './dto/generate-statement.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import { Role } from '@lol/shared';
import type { StatementDto, StatementArchiveItem } from '@lol/shared';

@Controller('statements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Accountant, Role.Dispatcher)
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  /** GET /api/statements — list archive, newest first. */
  @Get()
  async list(): Promise<StatementArchiveItem[]> {
    return this.statementsService.listArchive();
  }

  /** POST /api/statements/preview — preview without persisting. */
  @Post('preview')
  async preview(
    @Body() dto: GenerateStatementDto,
    @Req() req: any,
  ): Promise<StatementDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.statementsService.preview(dto, userId);
  }

  /** POST /api/statements — generate + persist a statement. */
  @Post()
  async generate(
    @Body() dto: GenerateStatementDto,
    @Req() req: any,
  ): Promise<StatementDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.statementsService.generate(dto, userId);
  }

  /** GET /api/statements/:id — fetch a single statement. */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<StatementDto> {
    return this.statementsService.findById(id);
  }
}

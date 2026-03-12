import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { SalaryRulesService } from './salary-rules.service';
import { CreateSalaryRuleDto } from './dto/create-salary-rule.dto';
import { UpdateSalaryRuleDto } from './dto/update-salary-rule.dto';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import { Role } from '@lol/shared';
import type { SalaryRuleDto, SalaryRuleListItem } from '@lol/shared';

@Controller('salary-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Accountant)
export class SalaryRulesController {
  constructor(private readonly salaryRulesService: SalaryRulesService) {}

  /** GET /api/salary-rules — list all rule sets, newest first. */
  @Get()
  async list(): Promise<SalaryRuleListItem[]> {
    return this.salaryRulesService.list();
  }

  /** GET /api/salary-rules/active — get the currently active rule set. */
  @Get('active')
  async getActive(): Promise<SalaryRuleDto | null> {
    return this.salaryRulesService.getActive();
  }

  /** GET /api/salary-rules/:id — get a single rule set by ID. */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<SalaryRuleDto> {
    return this.salaryRulesService.findById(id);
  }

  /** POST /api/salary-rules — create a new rule set. */
  @Post()
  async create(
    @Body() dto: CreateSalaryRuleDto,
    @Req() req: any,
  ): Promise<SalaryRuleDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryRulesService.create(dto, userId);
  }

  /** PUT /api/salary-rules/:id — update a rule set (creates new version). */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalaryRuleDto,
    @Req() req: any,
  ): Promise<SalaryRuleDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.salaryRulesService.update(id, dto, userId);
  }

  /** POST /api/salary-rules/:id/activate — activate this rule set. */
  @Post(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<SalaryRuleDto> {
    return this.salaryRulesService.activate(id);
  }

  /** POST /api/salary-rules/:id/deactivate — deactivate this rule set. */
  @Post(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<SalaryRuleDto> {
    return this.salaryRulesService.deactivate(id);
  }
}

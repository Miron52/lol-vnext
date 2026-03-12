import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statement } from './entities/statement.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { GenerateStatementDto } from './dto/generate-statement.dto';
import type {
  StatementDto,
  StatementArchiveItem,
  StatementSnapshot,
  StatementLoadLine,
  StatementTotals,
} from '@lol/shared';

@Injectable()
export class StatementsService {
  constructor(
    @InjectRepository(Statement)
    private readonly statementsRepo: Repository<Statement>,
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
    @InjectRepository(Week)
    private readonly weeksRepo: Repository<Week>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Generate (preview) a statement snapshot without persisting.
   * Returns the same shape as a saved statement but with id = '' and generatedAt = now.
   */
  async preview(dto: GenerateStatementDto, userId: string): Promise<StatementDto> {
    const { week, user } = await this.resolveContext(dto.weekId, userId);
    const snapshot = await this.buildSnapshot(dto);

    return {
      id: '',
      statementType: dto.statementType,
      weekId: week.id,
      weekLabel: week.label,
      unitId: dto.unitId || null,
      generatedAt: new Date().toISOString(),
      generatedById: user.id,
      generatedByName: `${user.firstName} ${user.lastName}`,
      snapshot,
    };
  }

  /**
   * Generate and persist a statement snapshot.
   */
  async generate(dto: GenerateStatementDto, userId: string): Promise<StatementDto> {
    const { week, user } = await this.resolveContext(dto.weekId, userId);
    const snapshot = await this.buildSnapshot(dto);

    const entity = this.statementsRepo.create({
      statementType: dto.statementType,
      weekId: week.id,
      weekLabel: week.label,
      unitId: dto.unitId || null,
      generatedById: user.id,
      generatedByName: `${user.firstName} ${user.lastName}`,
      snapshot,
      loadCount: snapshot.totals.loadCount,
      totalGross: snapshot.totals.grossAmount,
      totalNetProfit: snapshot.totals.netProfitAmount,
    });

    const saved = await this.statementsRepo.save(entity);

    return this.toDto(saved);
  }

  /** List archive, newest first. */
  async listArchive(): Promise<StatementArchiveItem[]> {
    const items = await this.statementsRepo.find({
      order: { generatedAt: 'DESC' },
    });

    return items.map((s) => ({
      id: s.id,
      statementType: s.statementType,
      weekId: s.weekId,
      weekLabel: s.weekLabel,
      unitId: s.unitId,
      loadCount: s.loadCount,
      totalGross: round2(Number(s.totalGross)),
      totalNetProfit: round2(Number(s.totalNetProfit)),
      generatedAt: s.generatedAt.toISOString(),
      generatedByName: s.generatedByName,
    }));
  }

  /** Fetch a single statement by id. */
  async findById(id: string): Promise<StatementDto> {
    const stmt = await this.statementsRepo.findOne({ where: { id } });
    if (!stmt) throw new NotFoundException(`Statement ${id} not found`);
    return this.toDto(stmt);
  }

  // ── Private helpers ────────────────────────────────────────

  private async resolveContext(weekId: string, userId: string) {
    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new BadRequestException(`Week ${weekId} not found`);

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException(`User ${userId} not found`);

    return { week, user };
  }

  private async buildSnapshot(dto: GenerateStatementDto): Promise<StatementSnapshot> {
    const qb = this.loadsRepo
      .createQueryBuilder('load')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId = :weekId', { weekId: dto.weekId });

    // Payment filter
    if (dto.paymentFilter === 'quick_pay') {
      qb.andWhere('load.quickPayFlag = true');
    } else if (dto.paymentFilter === 'direct') {
      qb.andWhere('load.directPaymentFlag = true');
    }

    // Only unpaid — uses driverPaidFlag
    if (dto.onlyUnpaid) {
      qb.andWhere('load.driverPaidFlag = false');
    }

    // Unit filter
    if (dto.unitId) {
      qb.andWhere('load.unitId = :unitId', { unitId: dto.unitId });
    }

    qb.orderBy('load.date', 'ASC').addOrderBy('load.sylNumber', 'ASC');

    const loads = await qb.getMany();

    const lines: StatementLoadLine[] = loads.map((l) => ({
      sylNumber: l.sylNumber,
      date: l.date,
      fromAddress: l.fromAddress,
      toAddress: l.toAddress,
      miles: Number(l.miles),
      grossAmount: Number(l.grossAmount),
      driverCostAmount: Number(l.driverCostAmount),
      profitAmount: Number(l.profitAmount),
      otrAmount: Number(l.otrAmount),
      netProfitAmount: Number(l.netProfitAmount),
      quickPayFlag: l.quickPayFlag,
      directPaymentFlag: l.directPaymentFlag,
      factoringFlag: l.factoringFlag,
      driverPaidFlag: l.driverPaidFlag,
    }));

    const totals: StatementTotals = {
      loadCount: lines.length,
      grossAmount: round2(lines.reduce((s, l) => s + l.grossAmount, 0)),
      driverCostAmount: round2(lines.reduce((s, l) => s + l.driverCostAmount, 0)),
      profitAmount: round2(lines.reduce((s, l) => s + l.profitAmount, 0)),
      otrAmount: round2(lines.reduce((s, l) => s + l.otrAmount, 0)),
      netProfitAmount: round2(lines.reduce((s, l) => s + l.netProfitAmount, 0)),
    };

    return { loads: lines, totals };
  }

  private toDto(s: Statement): StatementDto {
    return {
      id: s.id,
      statementType: s.statementType,
      weekId: s.weekId,
      weekLabel: s.weekLabel,
      unitId: s.unitId,
      generatedAt: s.generatedAt.toISOString(),
      generatedById: s.generatedById,
      generatedByName: s.generatedByName,
      snapshot: s.snapshot,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

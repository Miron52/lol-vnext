import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SalaryRecord } from './entities/salary-record.entity';
import { SalaryWeekState } from './entities/salary-week-state.entity';
import { SalaryAuditLog } from './entities/salary-audit-log.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { AdjustmentDto } from './dto/generate-salary.dto';
import { Role } from '@lol/shared';
import type {
  SalaryRowDto,
  SalaryRecordDto,
  SalarySnapshot,
  SalarySnapshotLoadLine,
  SalaryAdjustment,
  SalaryRuleTier,
  SalaryWeekStateDto,
  SalaryWeekStatus,
  SalaryAuditAction,
  SalaryAuditLogDto,
} from '@lol/shared';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryRecord)
    private readonly salaryRepo: Repository<SalaryRecord>,
    @InjectRepository(SalaryWeekState)
    private readonly weekStateRepo: Repository<SalaryWeekState>,
    @InjectRepository(SalaryAuditLog)
    private readonly auditRepo: Repository<SalaryAuditLog>,
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
    @InjectRepository(Week)
    private readonly weeksRepo: Repository<Week>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(SalaryRule)
    private readonly rulesRepo: Repository<SalaryRule>,
  ) {}

  // ── Week state ──────────────────────────────────────────────────

  async getWeekState(weekId: string): Promise<SalaryWeekStateDto> {
    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const state = await this.weekStateRepo.findOne({ where: { weekId } });
    return {
      weekId,
      weekLabel: week.label,
      status: state?.status ?? 'open',
      generatedAt: state?.generatedAt?.toISOString() ?? null,
      generatedByName: state?.generatedByName ?? null,
      frozenAt: state?.frozenAt?.toISOString() ?? null,
      frozenByName: state?.frozenByName ?? null,
    };
  }

  // ── Preview all dispatchers for a week ──────────────────────────

  async previewWeek(weekId: string): Promise<SalaryRowDto[]> {
    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const rule = await this.getActiveRule();

    const dispatchers = await this.usersRepo.find({
      where: { role: Role.Dispatcher },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    // Only get current records (not old revisions)
    const existingRecords = await this.salaryRepo.find({
      where: { weekId, isCurrent: true },
    });
    const recordMap = new Map<string, SalaryRecord>();
    for (const rec of existingRecords) {
      recordMap.set(rec.dispatcherId, rec);
    }

    const loads = await this.loadsRepo.find({
      where: { weekId, archivedAt: IsNull() },
    });

    const loadsByDispatcher = new Map<string, Load[]>();
    for (const load of loads) {
      const arr = loadsByDispatcher.get(load.dispatcherId) || [];
      arr.push(load);
      loadsByDispatcher.set(load.dispatcherId, arr);
    }

    const rows: SalaryRowDto[] = [];

    for (const disp of dispatchers) {
      const existing = recordMap.get(disp.id);

      if (existing) {
        rows.push(this.recordToRow(existing));
      } else {
        const dispLoads = loadsByDispatcher.get(disp.id) || [];
        const weeklyGrossProfit = this.round2(
          dispLoads.reduce((sum, l) => sum + Number(l.profitAmount), 0),
        );
        const { matchedTier, appliedPercent } = this.matchTier(rule.tiers, weeklyGrossProfit);
        const baseSalary = this.round2(
          Math.max(0, weeklyGrossProfit * appliedPercent / 100),
        );

        rows.push({
          id: '',
          dispatcherId: disp.id,
          dispatcherName: `${disp.firstName} ${disp.lastName}`,
          weekId,
          weekLabel: week.label,
          weeklyGrossProfit,
          appliedPercent,
          baseSalary,
          adjustments: [],
          totalOther: 0,
          totalBonus: 0,
          totalSalary: baseSalary,
          ruleVersion: rule.version,
          loadCount: dispLoads.length,
          isGenerated: false,
          generatedAt: null,
          generatedByName: null,
        });
      }
    }

    return rows;
  }

  // ── Generate salary for a single dispatcher ─────────────────────

  async generate(
    weekId: string,
    dispatcherId: string,
    adjustments: AdjustmentDto[],
    userId: string,
  ): Promise<SalaryRowDto> {
    await this.guardNotFrozen(weekId);

    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const dispatcher = await this.usersRepo.findOne({ where: { id: dispatcherId } });
    if (!dispatcher) throw new NotFoundException(`Dispatcher ${dispatcherId} not found`);

    const generatedBy = await this.usersRepo.findOne({ where: { id: userId } });
    if (!generatedBy) throw new NotFoundException(`User ${userId} not found`);

    const rule = await this.getActiveRule();
    this.validateAdjustments(adjustments);

    // Mark any existing current record as not current (preserve as historical revision)
    const existingCurrent = await this.salaryRepo.findOne({
      where: { weekId, dispatcherId, isCurrent: true },
    });
    let nextRevision = 1;
    if (existingCurrent) {
      existingCurrent.isCurrent = false;
      await this.salaryRepo.save(existingCurrent);
      nextRevision = existingCurrent.revision + 1;
    }

    const record = await this.buildAndSaveRecord(
      week, dispatcher, generatedBy, rule, adjustments, nextRevision, userId,
    );

    await this.ensureWeekState(weekId, 'generated', userId, generatedBy);

    const actionType: SalaryAuditAction = nextRevision === 1 ? 'generate' : 'recalculate';
    await this.audit(weekId, actionType, userId, generatedBy,
      `${actionType === 'generate' ? 'Generated' : 'Recalculated'} salary for ${dispatcher.firstName} ${dispatcher.lastName} (rev ${nextRevision})`,
    );

    return this.recordToRow(record);
  }

  // ── Recalculate all dispatchers for a week ──────────────────────

  async recalculateWeek(weekId: string, userId: string): Promise<SalaryRowDto[]> {
    await this.guardNotFrozen(weekId);

    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const generatedBy = await this.usersRepo.findOne({ where: { id: userId } });
    if (!generatedBy) throw new NotFoundException(`User ${userId} not found`);

    const rule = await this.getActiveRule();

    const currentRecords = await this.salaryRepo.find({
      where: { weekId, isCurrent: true },
    });

    if (currentRecords.length === 0) {
      throw new BadRequestException('No salary records to recalculate. Generate first.');
    }

    const results: SalaryRowDto[] = [];

    for (const existing of currentRecords) {
      existing.isCurrent = false;
      await this.salaryRepo.save(existing);

      // Carry forward adjustments from old snapshot
      const carryAdjustments: AdjustmentDto[] = existing.snapshot.adjustments.map((a) => ({
        type: a.type,
        amount: a.amount,
        note: a.note,
      }));

      const dispatcher = await this.usersRepo.findOne({ where: { id: existing.dispatcherId } });
      if (!dispatcher) continue;

      const newRecord = await this.buildAndSaveRecord(
        week, dispatcher, generatedBy, rule, carryAdjustments,
        existing.revision + 1, userId,
      );

      results.push(this.recordToRow(newRecord));
    }

    await this.ensureWeekState(weekId, 'generated', userId, generatedBy);

    await this.audit(weekId, 'recalculate', userId, generatedBy,
      `Recalculated salary for ${results.length} dispatcher(s)`,
    );

    return results;
  }

  // ── Freeze / Unfreeze ───────────────────────────────────────────

  async freezeWeek(weekId: string, userId: string): Promise<SalaryWeekStateDto> {
    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const state = await this.getOrCreateWeekState(weekId);

    if (state.status === 'frozen') {
      throw new BadRequestException('Week is already frozen.');
    }
    if (state.status === 'open') {
      throw new BadRequestException('Cannot freeze an open week. Generate salary first.');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    state.status = 'frozen';
    state.frozenAt = new Date();
    state.frozenById = userId;
    state.frozenByName = `${user.firstName} ${user.lastName}`;
    await this.weekStateRepo.save(state);

    await this.audit(weekId, 'freeze', userId, user, `Froze salary for week ${week.label}`);

    return this.getWeekState(weekId);
  }

  async unfreezeWeek(weekId: string, userId: string): Promise<SalaryWeekStateDto> {
    const week = await this.weeksRepo.findOne({ where: { id: weekId } });
    if (!week) throw new NotFoundException(`Week ${weekId} not found`);

    const state = await this.getOrCreateWeekState(weekId);

    if (state.status !== 'frozen') {
      throw new BadRequestException('Week is not frozen.');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    state.status = 'generated';
    state.frozenAt = null;
    state.frozenById = null;
    state.frozenByName = null;
    await this.weekStateRepo.save(state);

    await this.audit(weekId, 'unfreeze', userId, user, `Unfroze salary for week ${week.label}`);

    return this.getWeekState(weekId);
  }

  // ── Audit log ───────────────────────────────────────────────────

  async getAuditLog(weekId: string): Promise<SalaryAuditLogDto[]> {
    const logs = await this.auditRepo.find({
      where: { weekId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return logs.map((l) => ({
      id: l.id,
      weekId: l.weekId,
      action: l.action,
      performedByName: l.performedByName,
      detail: l.detail,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  // ── Get single record ───────────────────────────────────────────

  async findById(id: string): Promise<SalaryRecordDto> {
    const record = await this.salaryRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Salary record ${id} not found`);
    return {
      id: record.id,
      dispatcherId: record.dispatcherId,
      dispatcherName: record.dispatcherName,
      weekId: record.weekId,
      weekLabel: record.weekLabel,
      snapshot: record.snapshot,
      generatedById: record.generatedById,
      generatedByName: record.generatedByName,
      generatedAt: record.generatedAt.toISOString(),
    };
  }

  // ── Private helpers ─────────────────────────────────────────────

  private async guardNotFrozen(weekId: string): Promise<void> {
    const state = await this.weekStateRepo.findOne({ where: { weekId } });
    if (state?.status === 'frozen') {
      throw new ForbiddenException('This week is frozen. No changes allowed.');
    }
  }

  private async getOrCreateWeekState(weekId: string): Promise<SalaryWeekState> {
    let state = await this.weekStateRepo.findOne({ where: { weekId } });
    if (!state) {
      state = this.weekStateRepo.create({ weekId, status: 'open' as SalaryWeekStatus });
      state = await this.weekStateRepo.save(state);
    }
    return state;
  }

  private async ensureWeekState(
    weekId: string,
    targetStatus: SalaryWeekStatus,
    userId: string,
    user: User,
  ): Promise<void> {
    const state = await this.getOrCreateWeekState(weekId);
    if (state.status === 'open' || (state.status === 'generated' && targetStatus === 'generated')) {
      state.status = targetStatus;
      if (targetStatus === 'generated' && !state.generatedAt) {
        state.generatedAt = new Date();
        state.generatedById = userId;
        state.generatedByName = `${user.firstName} ${user.lastName}`;
      }
      await this.weekStateRepo.save(state);
    }
  }

  private async buildAndSaveRecord(
    week: Week,
    dispatcher: User,
    generatedBy: User,
    rule: SalaryRule,
    adjustments: AdjustmentDto[],
    revision: number,
    userId: string,
  ): Promise<SalaryRecord> {
    const loads = await this.loadsRepo.find({
      where: { weekId: week.id, dispatcherId: dispatcher.id, archivedAt: IsNull() },
    });

    const weeklyGrossProfit = this.round2(
      loads.reduce((sum, l) => sum + Number(l.profitAmount), 0),
    );
    const { matchedTier, appliedPercent } = this.matchTier(rule.tiers, weeklyGrossProfit);
    const baseSalary = this.round2(Math.max(0, weeklyGrossProfit * appliedPercent / 100));

    const now = new Date().toISOString();
    const createdByName = `${generatedBy.firstName} ${generatedBy.lastName}`;
    const salaryAdjustments: SalaryAdjustment[] = adjustments.map((a) => ({
      type: a.type,
      amount: this.round2(a.amount),
      note: a.note,
      createdBy: createdByName,
      createdAt: now,
    }));

    const totalOther = this.round2(
      salaryAdjustments.filter((a) => a.type === 'other').reduce((s, a) => s + a.amount, 0),
    );
    const totalBonus = this.round2(
      salaryAdjustments.filter((a) => a.type === 'bonus').reduce((s, a) => s + a.amount, 0),
    );
    const totalSalary = this.round2(baseSalary + totalOther + totalBonus);

    const loadLines: SalarySnapshotLoadLine[] = loads.map((l) => ({
      loadId: l.id, sylNumber: l.sylNumber, date: l.date,
      fromAddress: l.fromAddress, toAddress: l.toAddress,
      grossAmount: Number(l.grossAmount), driverCostAmount: Number(l.driverCostAmount),
      profitAmount: Number(l.profitAmount),
    }));

    const snapshot: SalarySnapshot = {
      dispatcherId: dispatcher.id,
      dispatcherName: `${dispatcher.firstName} ${dispatcher.lastName}`,
      weekId: week.id, weekLabel: week.label,
      loads: loadLines, weeklyGrossProfit,
      ruleVersion: rule.version, ruleSetName: rule.name, tiers: rule.tiers,
      matchedTier, appliedPercent, baseSalary,
      adjustments: salaryAdjustments, totalOther, totalBonus, totalSalary,
    };

    const record = this.salaryRepo.create({
      dispatcherId: dispatcher.id,
      dispatcherName: `${dispatcher.firstName} ${dispatcher.lastName}`,
      weekId: week.id, weekLabel: week.label,
      snapshot, weeklyGrossProfit, appliedPercent, baseSalary,
      totalOther, totalBonus, totalSalary,
      ruleVersion: rule.version, loadCount: loads.length,
      revision, isCurrent: true,
      generatedById: userId,
      generatedByName: `${generatedBy.firstName} ${generatedBy.lastName}`,
    });

    return this.salaryRepo.save(record);
  }

  private async audit(
    weekId: string, action: SalaryAuditAction,
    userId: string, user: User, detail: string,
  ): Promise<void> {
    await this.auditRepo.save(this.auditRepo.create({
      weekId, action, performedById: userId,
      performedByName: `${user.firstName} ${user.lastName}`, detail,
    }));
  }

  async getActiveRule(): Promise<SalaryRule> {
    const rule = await this.rulesRepo.findOne({ where: { isActive: true } });
    if (!rule) {
      throw new BadRequestException('No active salary rule set. Configure one in Settings > Salary Rules.');
    }
    return rule;
  }

  private matchTier(
    tiers: SalaryRuleTier[], weeklyGrossProfit: number,
  ): { matchedTier: number; appliedPercent: number } {
    if (weeklyGrossProfit <= 0) {
      const first = tiers[0];
      return { matchedTier: first.tierOrder, appliedPercent: first.percent };
    }
    const sorted = [...tiers].sort((a, b) => a.tierOrder - b.tierOrder);
    for (const tier of sorted) {
      if (weeklyGrossProfit >= tier.minProfit && (tier.maxProfit === null || weeklyGrossProfit < tier.maxProfit)) {
        return { matchedTier: tier.tierOrder, appliedPercent: tier.percent };
      }
    }
    const last = sorted[sorted.length - 1];
    return { matchedTier: last.tierOrder, appliedPercent: last.percent };
  }

  private validateAdjustments(adjustments: AdjustmentDto[]): void {
    for (const adj of adjustments) {
      if (!adj.note || adj.note.trim().length === 0) throw new BadRequestException('Each adjustment requires a note.');
      if (adj.type === 'bonus' && adj.amount < 0) throw new BadRequestException('Bonus must be >= 0.');
    }
  }

  private recordToRow(r: SalaryRecord): SalaryRowDto {
    return {
      id: r.id, dispatcherId: r.dispatcherId, dispatcherName: r.dispatcherName,
      weekId: r.weekId, weekLabel: r.weekLabel,
      weeklyGrossProfit: Number(r.weeklyGrossProfit), appliedPercent: Number(r.appliedPercent),
      baseSalary: Number(r.baseSalary), adjustments: r.snapshot.adjustments,
      totalOther: Number(r.totalOther), totalBonus: Number(r.totalBonus),
      totalSalary: Number(r.totalSalary), ruleVersion: r.ruleVersion, loadCount: r.loadCount,
      isGenerated: true, generatedAt: r.generatedAt.toISOString(), generatedByName: r.generatedByName,
    };
  }

  private round2(n: number): number { return Math.round(n * 100) / 100; }
}

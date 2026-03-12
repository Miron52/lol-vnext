import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryRule } from './entities/salary-rule.entity';
import { CreateSalaryRuleDto, TierRowDto } from './dto/create-salary-rule.dto';
import { UpdateSalaryRuleDto } from './dto/update-salary-rule.dto';
import { User } from '../identity/entities/user.entity';
import type {
  SalaryRuleDto,
  SalaryRuleListItem,
  SalaryRuleTier,
} from '@lol/shared';

@Injectable()
export class SalaryRulesService {
  constructor(
    @InjectRepository(SalaryRule)
    private readonly rulesRepo: Repository<SalaryRule>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ── List ──────────────────────────────────────────────────────

  async list(): Promise<SalaryRuleListItem[]> {
    const rules = await this.rulesRepo.find({
      order: { createdAt: 'DESC' },
    });
    return rules.map((r) => this.toListItem(r));
  }

  // ── Get active ────────────────────────────────────────────────

  async getActive(): Promise<SalaryRuleDto | null> {
    const rule = await this.rulesRepo.findOne({
      where: { isActive: true },
    });
    return rule ? this.toDto(rule) : null;
  }

  // ── Find by ID ────────────────────────────────────────────────

  async findById(id: string): Promise<SalaryRuleDto> {
    const rule = await this.rulesRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Salary rule ${id} not found`);
    return this.toDto(rule);
  }

  // ── Create ────────────────────────────────────────────────────

  async create(dto: CreateSalaryRuleDto, userId: string): Promise<SalaryRuleDto> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const tiers = this.validateAndNormalizeTiers(dto.tiers);

    const rule = this.rulesRepo.create({
      name: dto.name,
      version: 1,
      isActive: false,
      effectiveFrom: dto.effectiveFrom,
      applicationMode: 'flat_rate',
      salaryBase: 'gross_profit',
      tiers,
      createdById: userId,
      createdByName: `${user.firstName} ${user.lastName}`,
    });

    const saved = await this.rulesRepo.save(rule);
    return this.toDto(saved);
  }

  // ── Update (creates new version) ─────────────────────────────

  async update(id: string, dto: UpdateSalaryRuleDto, userId: string): Promise<SalaryRuleDto> {
    const existing = await this.rulesRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Salary rule ${id} not found`);

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Prepare new version values
    const tiers = dto.tiers
      ? this.validateAndNormalizeTiers(dto.tiers)
      : existing.tiers;

    const name = dto.name ?? existing.name;
    const effectiveFrom = dto.effectiveFrom ?? existing.effectiveFrom;

    // Create new version row (append-only: old row untouched)
    const newVersion = this.rulesRepo.create({
      name,
      version: existing.version + 1,
      isActive: existing.isActive,
      effectiveFrom,
      applicationMode: existing.applicationMode,
      salaryBase: existing.salaryBase,
      tiers,
      createdById: userId,
      createdByName: `${user.firstName} ${user.lastName}`,
    });

    // Deactivate old version if it was active (new version inherits active state)
    if (existing.isActive) {
      existing.isActive = false;
      await this.rulesRepo.save(existing);
    }

    const saved = await this.rulesRepo.save(newVersion);
    return this.toDto(saved);
  }

  // ── Activate ──────────────────────────────────────────────────

  async activate(id: string): Promise<SalaryRuleDto> {
    const rule = await this.rulesRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Salary rule ${id} not found`);

    if (rule.isActive) return this.toDto(rule); // already active

    // Deactivate any currently active rule
    await this.rulesRepo
      .createQueryBuilder()
      .update(SalaryRule)
      .set({ isActive: false })
      .where('isActive = :val', { val: true })
      .execute();

    rule.isActive = true;
    const saved = await this.rulesRepo.save(rule);
    return this.toDto(saved);
  }

  // ── Deactivate ────────────────────────────────────────────────

  async deactivate(id: string): Promise<SalaryRuleDto> {
    const rule = await this.rulesRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Salary rule ${id} not found`);

    rule.isActive = false;
    const saved = await this.rulesRepo.save(rule);
    return this.toDto(saved);
  }

  // ── Tier validation ───────────────────────────────────────────

  validateAndNormalizeTiers(tiers: TierRowDto[]): SalaryRuleTier[] {
    if (!tiers || tiers.length === 0) {
      throw new BadRequestException('At least one tier row is required.');
    }

    // Sort by tierOrder
    const sorted = [...tiers].sort((a, b) => a.tierOrder - b.tierOrder);

    // Validate first tier starts at 0
    if (sorted[0].minProfit !== 0) {
      throw new BadRequestException('First tier must start at minProfit = 0.');
    }

    // Validate last tier has null maxProfit (unbounded)
    const last = sorted[sorted.length - 1];
    if (last.maxProfit !== null && last.maxProfit !== undefined) {
      throw new BadRequestException('Last tier must have maxProfit = null (unbounded top tier).');
    }

    // Validate each tier
    for (let i = 0; i < sorted.length; i++) {
      const tier = sorted[i];

      // percent >= 0 and <= 100
      if (tier.percent < 0 || tier.percent > 100) {
        throw new BadRequestException(
          `Tier ${tier.tierOrder}: percent must be between 0 and 100.`,
        );
      }

      // For non-last tiers, maxProfit must be > minProfit
      if (i < sorted.length - 1) {
        if (tier.maxProfit === null || tier.maxProfit === undefined) {
          throw new BadRequestException(
            `Tier ${tier.tierOrder}: only the last tier may have null maxProfit.`,
          );
        }
        if (tier.maxProfit <= tier.minProfit) {
          throw new BadRequestException(
            `Tier ${tier.tierOrder}: maxProfit must be greater than minProfit.`,
          );
        }
      }

      // Contiguity: next tier's minProfit must equal this tier's maxProfit
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        if (next.minProfit !== tier.maxProfit) {
          throw new BadRequestException(
            `Tier gap between tier ${tier.tierOrder} (max=${tier.maxProfit}) and tier ${next.tierOrder} (min=${next.minProfit}). Boundaries must be contiguous.`,
          );
        }
      }
    }

    // Normalize to SalaryRuleTier[]
    return sorted.map((t) => ({
      tierOrder: t.tierOrder,
      minProfit: t.minProfit,
      maxProfit: t.maxProfit ?? null,
      percent: t.percent,
    }));
  }

  // ── DTO mappers ───────────────────────────────────────────────

  private toDto(r: SalaryRule): SalaryRuleDto {
    return {
      id: r.id,
      name: r.name,
      version: r.version,
      isActive: r.isActive,
      effectiveFrom: r.effectiveFrom,
      applicationMode: r.applicationMode,
      salaryBase: r.salaryBase,
      tiers: r.tiers,
      createdById: r.createdById,
      createdByName: r.createdByName,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private toListItem(r: SalaryRule): SalaryRuleListItem {
    return {
      id: r.id,
      name: r.name,
      version: r.version,
      isActive: r.isActive,
      effectiveFrom: r.effectiveFrom,
      tierCount: r.tiers.length,
      createdByName: r.createdByName,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

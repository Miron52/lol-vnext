import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from './entities/load.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { LoadDto, calcFinanceBreakdown } from '@lol/shared';

/** Filter params for weekly export. */
export interface ExportFilters {
  weekId: string;
  /** 'all' | 'quick_pay' | 'direct' */
  paymentFilter?: string;
  /** Only loads where driverPaidFlag = false */
  onlyUnpaid?: boolean;
  /** Exclude loads that have a brokerageId */
  excludeBrokers?: boolean;
}

/**
 * Fixed CSV export column order.
 * This is the documented export schema for v1.
 */
export const EXPORT_COLUMNS = [
  'sylNumber',
  'date',
  'businessName',
  'brokerageId',
  'fromAddress',
  'fromState',
  'fromDate',
  'toAddress',
  'toState',
  'toDate',
  'miles',
  'grossAmount',
  'driverCostAmount',
  'profitAmount',
  'profitPercent',
  'otrAmount',
  'netProfitAmount',
  'quickPayFlag',
  'directPaymentFlag',
  'factoringFlag',
  'driverPaidFlag',
  'loadStatus',
  'comment',
  'netsuiteRef',
] as const;

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
  ) {}

  /**
   * List loads, newest first. Optionally filter by weekId.
   * By default excludes archived loads. Pass includeArchived=true to include them.
   */
  async list(weekId?: string, includeArchived = false): Promise<LoadDto[]> {
    const qb = this.loadsRepo.createQueryBuilder('load');

    if (!includeArchived) {
      qb.where('load.archivedAt IS NULL');
    }

    if (weekId) {
      qb.andWhere('load.weekId = :weekId', { weekId });
    }

    qb.orderBy('load.createdAt', 'DESC');

    const loads = await qb.getMany();
    return loads.map((l) => this.toDto(l));
  }

  /** Find by primary key. */
  async findById(id: string): Promise<LoadDto> {
    const load = await this.loadsRepo.findOne({ where: { id } });
    if (!load) throw new NotFoundException(`Load ${id} not found`);
    return this.toDto(load);
  }

  /** Create a new load. Computes derived fields. */
  async create(dto: CreateLoadDto): Promise<LoadDto> {
    // Check syl_number uniqueness (friendlier error than DB constraint)
    const existing = await this.loadsRepo.findOne({
      where: { sylNumber: dto.sylNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Load with sylNumber "${dto.sylNumber}" already exists`,
      );
    }

    const finance = calcFinanceBreakdown(dto.grossAmount, dto.driverCostAmount);

    const load = this.loadsRepo.create({
      ...dto,
      ...finance,
    });

    const saved = await this.loadsRepo.save(load);
    return this.toDto(saved);
  }

  /** Partial update. Recomputes derived fields if financials change. */
  async update(id: string, dto: UpdateLoadDto): Promise<LoadDto> {
    const load = await this.loadsRepo.findOne({ where: { id } });
    if (!load) throw new NotFoundException(`Load ${id} not found`);

    if (load.archivedAt) {
      throw new ForbiddenException('Cannot edit an archived load. Unarchive it first.');
    }

    // If syl_number is being changed, check uniqueness
    if (dto.sylNumber && dto.sylNumber !== load.sylNumber) {
      const conflict = await this.loadsRepo.findOne({
        where: { sylNumber: dto.sylNumber },
      });
      if (conflict) {
        throw new ConflictException(
          `Load with sylNumber "${dto.sylNumber}" already exists`,
        );
      }
    }

    Object.assign(load, dto);

    // Recompute derived fields whenever gross or driver cost may have changed
    if (dto.grossAmount !== undefined || dto.driverCostAmount !== undefined) {
      const finance = calcFinanceBreakdown(load.grossAmount, load.driverCostAmount);
      load.profitAmount = finance.profitAmount;
      load.profitPercent = finance.profitPercent;
      load.otrAmount = finance.otrAmount;
      load.netProfitAmount = finance.netProfitAmount;
    }

    const saved = await this.loadsRepo.save(load);
    return this.toDto(saved);
  }

  // ── Archive / Unarchive ────────────────────────────────────

  /** Soft-archive a load. Sets archivedAt timestamp. */
  async archive(id: string): Promise<LoadDto> {
    const load = await this.loadsRepo.findOne({ where: { id } });
    if (!load) throw new NotFoundException(`Load ${id} not found`);

    if (load.archivedAt) {
      throw new BadRequestException('Load is already archived.');
    }

    load.archivedAt = new Date();
    const saved = await this.loadsRepo.save(load);
    return this.toDto(saved);
  }

  /** Unarchive a load. Clears archivedAt timestamp. */
  async unarchive(id: string): Promise<LoadDto> {
    const load = await this.loadsRepo.findOne({ where: { id } });
    if (!load) throw new NotFoundException(`Load ${id} not found`);

    if (!load.archivedAt) {
      throw new BadRequestException('Load is not archived.');
    }

    load.archivedAt = null;
    const saved = await this.loadsRepo.save(load);
    return this.toDto(saved);
  }

  // ── Export ──────────────────────────────────────────────────

  /**
   * Build a CSV string for the given export filters.
   * Server-side filtering ensures the export matches acceptance criteria:
   * - archived loads excluded
   * - payment filter (quick_pay / direct / all)
   * - only unpaid (driverPaidFlag = false)
   * - exclude brokers (brokerageId IS NOT NULL)
   */
  async exportCsv(filters: ExportFilters): Promise<{ csv: string; count: number }> {
    if (!filters.weekId) {
      throw new BadRequestException('weekId is required for export');
    }

    const qb = this.loadsRepo
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.week', 'week')
      .leftJoinAndSelect('load.dispatcher', 'dispatcher')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId = :weekId', { weekId: filters.weekId });

    // Payment filter
    if (filters.paymentFilter === 'quick_pay') {
      qb.andWhere('load.quickPayFlag = true');
    } else if (filters.paymentFilter === 'direct') {
      qb.andWhere('load.directPaymentFlag = true');
    }

    // Only unpaid
    if (filters.onlyUnpaid) {
      qb.andWhere('load.driverPaidFlag = false');
    }

    // Exclude brokers
    if (filters.excludeBrokers) {
      qb.andWhere('load.brokerageId IS NULL');
    }

    qb.orderBy('load.date', 'ASC').addOrderBy('load.sylNumber', 'ASC');

    const loads = await qb.getMany();

    const csv = this.buildCsv(loads);
    return { csv, count: loads.length };
  }

  private buildCsv(loads: Load[]): string {
    const header = EXPORT_COLUMNS.join(',');

    if (loads.length === 0) {
      return header + '\n';
    }

    const rows = loads.map((l) => {
      const record: Record<string, string | number | boolean | null> = {
        sylNumber: l.sylNumber,
        date: l.date,
        businessName: l.businessName,
        brokerageId: l.brokerageId,
        fromAddress: l.fromAddress,
        fromState: l.fromState,
        fromDate: l.fromDate,
        toAddress: l.toAddress,
        toState: l.toState,
        toDate: l.toDate,
        miles: Number(l.miles),
        grossAmount: Number(l.grossAmount),
        driverCostAmount: Number(l.driverCostAmount),
        profitAmount: Number(l.profitAmount),
        profitPercent: Number(l.profitPercent),
        otrAmount: Number(l.otrAmount),
        netProfitAmount: Number(l.netProfitAmount),
        quickPayFlag: l.quickPayFlag,
        directPaymentFlag: l.directPaymentFlag,
        factoringFlag: l.factoringFlag,
        driverPaidFlag: l.driverPaidFlag,
        loadStatus: l.loadStatus,
        comment: l.comment,
        netsuiteRef: l.netsuiteRef,
      };

      return EXPORT_COLUMNS.map((col) => this.csvEscape(record[col])).join(',');
    });

    return [header, ...rows].join('\n') + '\n';
  }

  private csvEscape(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Wrap in quotes if the value contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  private toDto(l: Load): LoadDto {
    return {
      id: l.id,
      sylNumber: l.sylNumber,
      externalSource: l.externalSource,
      externalLoadKey: l.externalLoadKey,
      weekId: l.weekId,
      date: l.date,
      unitId: l.unitId,
      driverId: l.driverId,
      dispatcherId: l.dispatcherId,
      businessName: l.businessName,
      brokerageId: l.brokerageId,
      netsuiteRef: l.netsuiteRef,
      fromAddress: l.fromAddress,
      fromState: l.fromState,
      fromDate: l.fromDate,
      toAddress: l.toAddress,
      toState: l.toState,
      toDate: l.toDate,
      miles: Number(l.miles),
      grossAmount: Number(l.grossAmount),
      driverCostAmount: Number(l.driverCostAmount),
      profitAmount: Number(l.profitAmount),
      profitPercent: Number(l.profitPercent),
      otrAmount: Number(l.otrAmount),
      netProfitAmount: Number(l.netProfitAmount),
      quickPayFlag: l.quickPayFlag,
      directPaymentFlag: l.directPaymentFlag,
      factoringFlag: l.factoringFlag,
      driverPaidFlag: l.driverPaidFlag,
      loadStatus: l.loadStatus,
      comment: l.comment,
      auditSource: l.auditSource,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      archivedAt: l.archivedAt ? l.archivedAt.toISOString() : null,
    };
  }
}

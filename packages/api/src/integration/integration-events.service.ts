import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';

import { IntegrationEvent } from './entities/integration-event.entity';
import { Load } from '../load/entities/load.entity';
import { User } from '../identity/entities/user.entity';
import { Week } from '../week/entities/week.entity';
import { WeeksService } from '../week/weeks.service';

import {
  IntegrationEventStatus,
  IntegrationEventResult,
  IntegrationEventDto,
  CargoWebhookPayload,
  LoadStatus,
  calcProfit,
  calcProfitPercent,
  isoWeekOfDate,
} from '@lol/shared';

const SOURCE_SYSTEM = 'cargo';

@Injectable()
export class IntegrationEventsService {
  private readonly logger = new Logger(IntegrationEventsService.name);

  constructor(
    @InjectRepository(IntegrationEvent)
    private readonly eventsRepo: Repository<IntegrationEvent>,
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly weeksService: WeeksService,
  ) {}

  /**
   * Main entry point for Cargo webhook ingestion.
   *
   * Flow:
   * 1. Compute payload hash
   * 2. Save raw event (status = pending)
   * 3. Check for duplicate (hash or externalEventId)
   * 4. Validate & normalize payload
   * 5. Resolve week + dispatcher
   * 6. Find existing load (by external key or sylNumber)
   * 7. Create or update load
   * 8. Update event with result
   */
  async processCargoWebhook(
    payload: CargoWebhookPayload,
  ): Promise<IntegrationEventDto> {
    const payloadHash = this.hashPayload(payload);
    const eventType = payload.eventType || 'load.upsert';
    const externalEventId = payload.eventId || null;

    // ── Step 1: Persist raw event ──────────────────────────────────
    let event = this.eventsRepo.create({
      sourceSystem: SOURCE_SYSTEM,
      externalEventId,
      eventType,
      payloadHash,
      payloadJson: payload as unknown as Record<string, unknown>,
      processingStatus: IntegrationEventStatus.Pending,
      processingResult: null,
      processingError: null,
      loadId: null,
    });

    try {
      event = await this.eventsRepo.save(event);
    } catch (err: any) {
      // Unique constraint violation on (sourceSystem, payloadHash) or (sourceSystem, externalEventId)
      if (err.code === '23505') {
        return this.handleDuplicateEvent(payloadHash, externalEventId);
      }
      throw err;
    }

    // ── Step 2: Process the event ──────────────────────────────────
    try {
      const result = await this.processEvent(event, payload);
      return result;
    } catch (err: any) {
      return this.failEvent(event, err.message || 'Unknown processing error');
    }
  }

  // ── Internal processing ────────────────────────────────────────

  private async processEvent(
    event: IntegrationEvent,
    payload: CargoWebhookPayload,
  ): Promise<IntegrationEventDto> {
    // Validate required fields
    this.validatePayload(payload);

    // Resolve dispatcher by email
    const dispatcher = await this.usersRepo.findOne({
      where: { email: payload.dispatcherEmail },
    });
    if (!dispatcher) {
      throw new Error(
        `Dispatcher not found for email: ${payload.dispatcherEmail}`,
      );
    }

    // Resolve week from load date
    const loadDate = new Date(payload.date);
    const { isoYear, isoWeek } = isoWeekOfDate(loadDate);
    const week = await this.weeksService.findOrCreate(isoYear, isoWeek);

    // Find existing load by canonical identity:
    // a) externalSource + externalLoadKey
    // b) fallback to sylNumber
    let existingLoad = await this.loadsRepo.findOne({
      where: {
        externalSource: SOURCE_SYSTEM,
        externalLoadKey: payload.loadKey,
      },
    });

    if (!existingLoad) {
      existingLoad = await this.loadsRepo.findOne({
        where: { sylNumber: payload.sylNumber },
      });
    }

    if (existingLoad) {
      return this.updateExistingLoad(event, existingLoad, payload, dispatcher, week);
    } else {
      return this.createNewLoad(event, payload, dispatcher, week);
    }
  }

  private async createNewLoad(
    event: IntegrationEvent,
    payload: CargoWebhookPayload,
    dispatcher: User,
    week: Week,
  ): Promise<IntegrationEventDto> {
    const profitAmount = calcProfit(payload.grossAmount, payload.driverCostAmount);
    const profitPercent = calcProfitPercent(payload.grossAmount, profitAmount);

    const loadStatus = this.resolveLoadStatus(payload.loadStatus);

    const load = this.loadsRepo.create({
      sylNumber: payload.sylNumber,
      externalSource: SOURCE_SYSTEM,
      externalLoadKey: payload.loadKey,
      weekId: week.id,
      date: payload.date,
      dispatcherId: dispatcher.id,
      businessName: payload.businessName,
      unitId: payload.unitId || null,
      driverId: payload.driverId || null,
      brokerageId: payload.brokerageId || null,
      netsuiteRef: payload.netsuiteRef || null,
      fromAddress: payload.fromAddress,
      fromState: payload.fromState,
      fromDate: payload.fromDate,
      toAddress: payload.toAddress,
      toState: payload.toState,
      toDate: payload.toDate,
      miles: payload.miles ?? 0,
      grossAmount: payload.grossAmount,
      driverCostAmount: payload.driverCostAmount,
      profitAmount,
      profitPercent,
      quickPayFlag: payload.quickPayFlag ?? false,
      directPaymentFlag: payload.directPaymentFlag ?? false,
      factoringFlag: payload.factoringFlag ?? false,
      driverPaidFlag: payload.driverPaidFlag ?? false,
      loadStatus,
      comment: payload.comment || null,
      auditSource: 'webhook',
    });

    const saved = await this.loadsRepo.save(load);

    return this.markProcessed(
      event,
      IntegrationEventResult.Created,
      saved.id,
    );
  }

  private async updateExistingLoad(
    event: IntegrationEvent,
    existingLoad: Load,
    payload: CargoWebhookPayload,
    dispatcher: User,
    week: Week,
  ): Promise<IntegrationEventDto> {
    // Update mutable fields from payload
    existingLoad.weekId = week.id;
    existingLoad.date = payload.date;
    existingLoad.dispatcherId = dispatcher.id;
    existingLoad.businessName = payload.businessName;
    existingLoad.fromAddress = payload.fromAddress;
    existingLoad.fromState = payload.fromState;
    existingLoad.fromDate = payload.fromDate;
    existingLoad.toAddress = payload.toAddress;
    existingLoad.toState = payload.toState;
    existingLoad.toDate = payload.toDate;
    existingLoad.miles = payload.miles ?? existingLoad.miles;
    existingLoad.grossAmount = payload.grossAmount;
    existingLoad.driverCostAmount = payload.driverCostAmount;
    existingLoad.profitAmount = calcProfit(payload.grossAmount, payload.driverCostAmount);
    existingLoad.profitPercent = calcProfitPercent(
      payload.grossAmount,
      existingLoad.profitAmount,
    );

    // Stamp external identity if not already set
    if (!existingLoad.externalSource) {
      existingLoad.externalSource = SOURCE_SYSTEM;
      existingLoad.externalLoadKey = payload.loadKey;
    }

    // Optional fields — only overwrite if present in payload
    if (payload.unitId !== undefined) existingLoad.unitId = payload.unitId || null;
    if (payload.driverId !== undefined) existingLoad.driverId = payload.driverId || null;
    if (payload.brokerageId !== undefined) existingLoad.brokerageId = payload.brokerageId || null;
    if (payload.netsuiteRef !== undefined) existingLoad.netsuiteRef = payload.netsuiteRef || null;
    if (payload.loadStatus !== undefined) {
      existingLoad.loadStatus = this.resolveLoadStatus(payload.loadStatus);
    }
    if (payload.comment !== undefined) existingLoad.comment = payload.comment || null;
    if (payload.quickPayFlag !== undefined) existingLoad.quickPayFlag = payload.quickPayFlag;
    if (payload.directPaymentFlag !== undefined) existingLoad.directPaymentFlag = payload.directPaymentFlag;
    if (payload.factoringFlag !== undefined) existingLoad.factoringFlag = payload.factoringFlag;
    if (payload.driverPaidFlag !== undefined) existingLoad.driverPaidFlag = payload.driverPaidFlag;

    // Audit: mark last modification source as webhook
    existingLoad.auditSource = 'webhook';

    const saved = await this.loadsRepo.save(existingLoad);

    return this.markProcessed(
      event,
      IntegrationEventResult.Updated,
      saved.id,
    );
  }

  // ── Helpers ────────────────────────────────────────────────────

  private validatePayload(payload: CargoWebhookPayload): void {
    const required: (keyof CargoWebhookPayload)[] = [
      'loadKey',
      'sylNumber',
      'date',
      'dispatcherEmail',
      'businessName',
      'fromAddress',
      'fromState',
      'fromDate',
      'toAddress',
      'toState',
      'toDate',
      'grossAmount',
      'driverCostAmount',
    ];

    const missing = required.filter(
      (field) => payload[field] === undefined || payload[field] === null || payload[field] === '',
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate ISO date format (YYYY-MM-DD) for all date fields
    const dateFields: (keyof CargoWebhookPayload)[] = ['date', 'fromDate', 'toDate'];
    for (const field of dateFields) {
      const value = payload[field] as string;
      if (!this.isValidIsoDate(value)) {
        throw new Error(`Invalid ISO date for field '${field}': ${value}`);
      }
    }
  }

  /**
   * Validates that a string is a valid ISO date (YYYY-MM-DD) that
   * parses to a real calendar date (rejects "2026-02-30", "not-a-date", etc.).
   */
  private isValidIsoDate(value: string): boolean {
    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRe.test(value)) return false;

    const parsed = new Date(value + 'T00:00:00Z');
    if (isNaN(parsed.getTime())) return false;

    // Verify round-trip: guards against dates like "2026-02-30" which
    // JS silently rolls to "2026-03-02".
    const [y, m, d] = value.split('-').map(Number);
    return (
      parsed.getUTCFullYear() === y &&
      parsed.getUTCMonth() + 1 === m &&
      parsed.getUTCDate() === d
    );
  }

  private resolveLoadStatus(status?: string): LoadStatus {
    if (!status) return LoadStatus.NotPickedUp;

    const map: Record<string, LoadStatus> = {
      not_picked_up: LoadStatus.NotPickedUp,
      in_transit: LoadStatus.InTransit,
      delivered: LoadStatus.Delivered,
      completed: LoadStatus.Completed,
      cancelled: LoadStatus.Cancelled,
    };

    return map[status.toLowerCase()] ?? LoadStatus.NotPickedUp;
  }

  private hashPayload(payload: CargoWebhookPayload): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Handle duplicate event detection.
   *
   * Semantics:
   * - Duplicate webhooks do NOT create a new integration_event row.
   * - The original row is looked up and returned as-is, regardless of its
   *   current processingStatus (pending, processed, failed).
   * - The original row is NEVER mutated by the duplicate path. It is the
   *   authoritative record of the first webhook attempt and must retain its
   *   true processing lifecycle.
   * - The duplicate nature of the *request* is communicated to the caller
   *   implicitly: the returned DTO carries the original event's id and
   *   status, and no new row appears in the table.
   *
   * The caller detects duplicates at INSERT time via the unique constraint on
   * (sourceSystem, payloadHash) or (sourceSystem, externalEventId). When the
   * INSERT fails with PG error 23505, we land here.
   */
  private async handleDuplicateEvent(
    payloadHash: string,
    externalEventId: string | null,
  ): Promise<IntegrationEventDto> {
    // Find the original event by hash first, then by externalEventId
    let original = await this.eventsRepo.findOne({
      where: { sourceSystem: SOURCE_SYSTEM, payloadHash },
    });

    if (!original && externalEventId) {
      original = await this.eventsRepo.findOne({
        where: { sourceSystem: SOURCE_SYSTEM, externalEventId },
      });
    }

    if (!original) {
      // Shouldn't reach here, but defensive
      throw new BadRequestException('Duplicate event detected but original not found');
    }

    this.logger.warn(
      `Duplicate event detected: hash=${payloadHash}, originalId=${original.id}, ` +
      `originalStatus=${original.processingStatus}`,
    );

    // Return original row unchanged — no mutation, no second row
    return this.toDto(original);
  }

  private async markProcessed(
    event: IntegrationEvent,
    result: IntegrationEventResult,
    loadId: string,
  ): Promise<IntegrationEventDto> {
    event.processingStatus = IntegrationEventStatus.Processed;
    event.processingResult = result;
    event.loadId = loadId;
    event.processedAt = new Date();
    const saved = await this.eventsRepo.save(event);
    return this.toDto(saved);
  }

  private async failEvent(
    event: IntegrationEvent,
    errorMessage: string,
  ): Promise<IntegrationEventDto> {
    this.logger.error(
      `Event ${event.id} processing failed: ${errorMessage}`,
    );
    event.processingStatus = IntegrationEventStatus.Failed;
    event.processingResult = IntegrationEventResult.Failed;
    event.processingError = errorMessage;
    event.processedAt = new Date();
    const saved = await this.eventsRepo.save(event);
    return this.toDto(saved);
  }

  private toDto(e: IntegrationEvent): IntegrationEventDto {
    return {
      id: e.id,
      sourceSystem: e.sourceSystem,
      externalEventId: e.externalEventId,
      eventType: e.eventType,
      payloadHash: e.payloadHash,
      payloadJson: e.payloadJson,
      processingStatus: e.processingStatus,
      processingResult: e.processingResult,
      processingError: e.processingError,
      loadId: e.loadId,
      receivedAt: e.receivedAt instanceof Date ? e.receivedAt.toISOString() : e.receivedAt,
      processedAt: e.processedAt instanceof Date ? e.processedAt.toISOString() : e.processedAt,
    };
  }
}

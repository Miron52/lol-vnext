import { Repository } from 'typeorm';
import { IntegrationEventsService } from './integration-events.service';
import { IntegrationEvent } from './entities/integration-event.entity';
import { Load } from '../load/entities/load.entity';
import { User } from '../identity/entities/user.entity';
import { WeeksService } from '../week/weeks.service';
import {
  IntegrationEventStatus,
  IntegrationEventResult,
  CargoWebhookPayload,
  LoadStatus,
} from '@lol/shared';

describe('IntegrationEventsService', () => {
  let service: IntegrationEventsService;
  let eventsRepo: Partial<Repository<IntegrationEvent>>;
  let loadsRepo: Partial<Repository<Load>>;
  let usersRepo: Partial<Repository<User>>;
  let weeksService: Partial<WeeksService>;

  const mockUser: Partial<User> = {
    id: 'uuid-dispatcher-1',
    email: 'driver@tlslogistics.us',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockWeek = {
    id: 'uuid-week-1',
    label: 'LS2026-11',
    isoYear: 2026,
    isoWeek: 11,
    startDate: '2026-03-09',
    endDate: '2026-03-15',
  };

  const validPayload: CargoWebhookPayload = {
    eventId: 'cargo-evt-001',
    eventType: 'load.created',
    loadKey: 'CARGO-12345',
    sylNumber: 'TLS26-11-50',
    date: '2026-03-10',
    dispatcherEmail: 'driver@tlslogistics.us',
    businessName: 'Acme Transport',
    fromAddress: 'Dallas, TX 75244',
    fromState: 'TX',
    fromDate: '2026-03-10',
    toAddress: 'Monticello, MS 39654',
    toState: 'MS',
    toDate: '2026-03-11',
    miles: 500,
    grossAmount: 5000,
    driverCostAmount: 3500,
  };

  let savedEventCounter: number;

  beforeEach(() => {
    savedEventCounter = 0;

    eventsRepo = {
      create: jest.fn().mockImplementation((data) => ({
        id: `uuid-event-${++savedEventCounter}`,
        receivedAt: new Date(),
        processedAt: null,
        ...data,
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue(null),
    };

    loadsRepo = {
      create: jest.fn().mockImplementation((data) => ({
        id: 'uuid-load-new',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue(null),
    };

    usersRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    weeksService = {
      findOrCreate: jest.fn().mockResolvedValue(mockWeek),
    };

    service = new IntegrationEventsService(
      eventsRepo as Repository<IntegrationEvent>,
      loadsRepo as Repository<Load>,
      usersRepo as Repository<User>,
      weeksService as WeeksService,
    );
  });

  // ── Create ────────────────────────────────────────────────────

  describe('processCargoWebhook — create new load', () => {
    it('should save raw event and create a new load', async () => {
      const result = await service.processCargoWebhook(validPayload);

      // Event saved
      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceSystem: 'cargo',
          externalEventId: 'cargo-evt-001',
          eventType: 'load.created',
        }),
      );
      expect(eventsRepo.save).toHaveBeenCalled();

      // Load created with derived fields
      expect(loadsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sylNumber: 'TLS26-11-50',
          externalSource: 'cargo',
          externalLoadKey: 'CARGO-12345',
          weekId: 'uuid-week-1',
          profitAmount: 1500,
          profitPercent: 30,
        }),
      );

      // Result reflects success
      expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
      expect(result.processingResult).toBe(IntegrationEventResult.Created);
      expect(result.loadId).toBe('uuid-load-new');
    });

    it('should set auditSource = webhook on created load', async () => {
      await service.processCargoWebhook(validPayload);

      expect(loadsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          auditSource: 'webhook',
        }),
      );
    });

    it('should resolve dispatcher by email', async () => {
      await service.processCargoWebhook(validPayload);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'driver@tlslogistics.us' },
      });

      expect(loadsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dispatcherId: 'uuid-dispatcher-1',
        }),
      );
    });

    it('should resolve week from load date via findOrCreate', async () => {
      await service.processCargoWebhook(validPayload);

      expect(weeksService.findOrCreate).toHaveBeenCalledWith(2026, 11);
    });
  });

  // ── Update ────────────────────────────────────────────────────

  describe('processCargoWebhook — update existing load', () => {
    const existingLoad: Partial<Load> = {
      id: 'uuid-load-existing',
      sylNumber: 'TLS26-11-50',
      externalSource: 'cargo',
      externalLoadKey: 'CARGO-12345',
      weekId: 'uuid-week-1',
      date: '2026-03-10',
      dispatcherId: 'uuid-dispatcher-1',
      businessName: 'Old Business',
      fromAddress: 'Old From',
      fromState: 'TX',
      fromDate: '2026-03-10',
      toAddress: 'Old To',
      toState: 'MS',
      toDate: '2026-03-11',
      miles: 100,
      grossAmount: 3000,
      driverCostAmount: 2000,
      profitAmount: 1000,
      profitPercent: 33.33,
      quickPayFlag: false,
      directPaymentFlag: false,
      factoringFlag: false,
      driverPaidFlag: false,
      loadStatus: LoadStatus.NotPickedUp,
      comment: null,
      auditSource: 'manual',
    };

    it('should update existing load found by external key', async () => {
      (loadsRepo.findOne as jest.Mock).mockImplementation((opts) => {
        if (opts.where?.externalSource === 'cargo' && opts.where?.externalLoadKey === 'CARGO-12345') {
          return Promise.resolve({ ...existingLoad });
        }
        return Promise.resolve(null);
      });

      const result = await service.processCargoWebhook(validPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
      expect(result.processingResult).toBe(IntegrationEventResult.Updated);

      // Verify financials were recomputed
      expect(loadsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          grossAmount: 5000,
          driverCostAmount: 3500,
          profitAmount: 1500,
          profitPercent: 30,
          businessName: 'Acme Transport',
        }),
      );
    });

    it('should set auditSource = webhook on updated load', async () => {
      (loadsRepo.findOne as jest.Mock).mockImplementation((opts) => {
        if (opts.where?.externalSource === 'cargo' && opts.where?.externalLoadKey === 'CARGO-12345') {
          return Promise.resolve({ ...existingLoad });
        }
        return Promise.resolve(null);
      });

      await service.processCargoWebhook(validPayload);

      expect(loadsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          auditSource: 'webhook',
        }),
      );
    });

    it('should fall back to sylNumber lookup when external key not found', async () => {
      let callCount = 0;
      (loadsRepo.findOne as jest.Mock).mockImplementation((opts) => {
        callCount++;
        // First call: external key lookup → not found
        if (callCount === 1) return Promise.resolve(null);
        // Second call: sylNumber lookup → found
        if (opts.where?.sylNumber === 'TLS26-11-50') {
          return Promise.resolve({ ...existingLoad, externalSource: null, externalLoadKey: null });
        }
        return Promise.resolve(null);
      });

      const result = await service.processCargoWebhook(validPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
      expect(result.processingResult).toBe(IntegrationEventResult.Updated);

      // Should have stamped external identity
      expect(loadsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          externalSource: 'cargo',
          externalLoadKey: 'CARGO-12345',
        }),
      );
    });
  });

  // ── Duplicate ─────────────────────────────────────────────────
  //
  // Duplicate semantics:
  // - No second integration_event row is created.
  // - The original row is returned as-is regardless of its status.
  // - The original row is NEVER mutated by the duplicate path.
  //

  describe('processCargoWebhook — duplicate event', () => {
    it('should return original processed event unchanged when hash collides', async () => {
      const originalEvent = {
        id: 'uuid-event-original',
        sourceSystem: 'cargo',
        externalEventId: 'cargo-evt-001',
        eventType: 'load.created',
        payloadHash: 'somehash',
        payloadJson: validPayload as unknown as Record<string, unknown>,
        processingStatus: IntegrationEventStatus.Processed,
        processingResult: IntegrationEventResult.Created,
        processingError: null,
        loadId: 'uuid-load-existing',
        receivedAt: new Date(),
        processedAt: new Date(),
        load: null,
      };

      (eventsRepo.save as jest.Mock).mockRejectedValueOnce({ code: '23505' });
      (eventsRepo.findOne as jest.Mock).mockResolvedValue(originalEvent);

      const result = await service.processCargoWebhook(validPayload);

      expect(result.id).toBe('uuid-event-original');
      expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
      expect(result.processingResult).toBe(IntegrationEventResult.Created);
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });

    it('should return original pending event unchanged — never mutate it', async () => {
      const pendingOriginal = {
        id: 'uuid-event-pending-original',
        sourceSystem: 'cargo',
        externalEventId: 'cargo-evt-002',
        eventType: 'load.created',
        payloadHash: 'somehash2',
        payloadJson: validPayload as unknown as Record<string, unknown>,
        processingStatus: IntegrationEventStatus.Pending,
        processingResult: null,
        processingError: null,
        loadId: null,
        receivedAt: new Date(),
        processedAt: null,
        load: null,
      };

      (eventsRepo.save as jest.Mock).mockRejectedValueOnce({ code: '23505' });
      (eventsRepo.findOne as jest.Mock).mockResolvedValue(pendingOriginal);

      const result = await service.processCargoWebhook(validPayload);

      // Returned as-is — still pending, not mutated
      expect(result.id).toBe('uuid-event-pending-original');
      expect(result.processingStatus).toBe(IntegrationEventStatus.Pending);
      expect(result.processingResult).toBeNull();
      expect(result.processedAt).toBeNull();
      // Original row was NOT saved again (no mutation)
      // eventsRepo.save was called once (the failed INSERT) and never again
      expect(eventsRepo.save).toHaveBeenCalledTimes(1);
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });

    it('should return original failed event unchanged', async () => {
      const failedOriginal = {
        id: 'uuid-event-failed-original',
        sourceSystem: 'cargo',
        externalEventId: 'cargo-evt-003',
        eventType: 'load.created',
        payloadHash: 'somehash3',
        payloadJson: validPayload as unknown as Record<string, unknown>,
        processingStatus: IntegrationEventStatus.Failed,
        processingResult: IntegrationEventResult.Failed,
        processingError: 'Dispatcher not found',
        loadId: null,
        receivedAt: new Date(),
        processedAt: new Date(),
        load: null,
      };

      (eventsRepo.save as jest.Mock).mockRejectedValueOnce({ code: '23505' });
      (eventsRepo.findOne as jest.Mock).mockResolvedValue(failedOriginal);

      const result = await service.processCargoWebhook(validPayload);

      expect(result.id).toBe('uuid-event-failed-original');
      expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
      expect(result.processingResult).toBe(IntegrationEventResult.Failed);
      expect(result.processingError).toBe('Dispatcher not found');
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });

    it('should not create a second integration_event row for duplicates', async () => {
      const originalEvent = {
        id: 'uuid-event-original',
        sourceSystem: 'cargo',
        externalEventId: 'cargo-evt-001',
        eventType: 'load.created',
        payloadHash: 'somehash',
        payloadJson: validPayload as unknown as Record<string, unknown>,
        processingStatus: IntegrationEventStatus.Processed,
        processingResult: IntegrationEventResult.Created,
        processingError: null,
        loadId: 'uuid-load-existing',
        receivedAt: new Date(),
        processedAt: new Date(),
        load: null,
      };

      (eventsRepo.save as jest.Mock).mockRejectedValueOnce({ code: '23505' });
      (eventsRepo.findOne as jest.Mock).mockResolvedValue(originalEvent);

      await service.processCargoWebhook(validPayload);

      // eventsRepo.create called once (the failed INSERT attempt), no second row
      expect(eventsRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── Failures ──────────────────────────────────────────────────

  describe('processCargoWebhook — failure scenarios', () => {
    it('should fail event when dispatcher email not found', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.processCargoWebhook(validPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
      expect(result.processingResult).toBe(IntegrationEventResult.Failed);
      expect(result.processingError).toContain('Dispatcher not found');
    });

    it('should fail event when required field is missing', async () => {
      const badPayload = { ...validPayload, sylNumber: '' };

      const result = await service.processCargoWebhook(badPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
      expect(result.processingResult).toBe(IntegrationEventResult.Failed);
      expect(result.processingError).toContain('Missing required fields');
      expect(result.processingError).toContain('sylNumber');
    });

    it('should fail event when load date is invalid', async () => {
      const badPayload = { ...validPayload, date: 'not-a-date' };

      const result = await service.processCargoWebhook(badPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
      expect(result.processingResult).toBe(IntegrationEventResult.Failed);
      expect(result.processingError).toContain("Invalid ISO date for field 'date'");
      // No load created or updated
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });

    it('should fail event when fromDate is not a real calendar date', async () => {
      const badPayload = { ...validPayload, fromDate: '2026-02-30' };

      const result = await service.processCargoWebhook(badPayload);

      expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
      expect(result.processingResult).toBe(IntegrationEventResult.Failed);
      expect(result.processingError).toContain("Invalid ISO date for field 'fromDate'");
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });

    it('should not corrupt load data on processing failure', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      await service.processCargoWebhook(validPayload);

      // No load create/save should have been called
      expect(loadsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── Load status mapping ───────────────────────────────────────

  describe('processCargoWebhook — load status mapping', () => {
    it('should map known status strings', async () => {
      const payload = { ...validPayload, loadStatus: 'delivered' };
      await service.processCargoWebhook(payload);

      expect(loadsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loadStatus: LoadStatus.Delivered,
        }),
      );
    });

    it('should default to NotPickedUp for unknown status', async () => {
      const payload = { ...validPayload, loadStatus: 'unknown_status' };
      await service.processCargoWebhook(payload);

      expect(loadsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loadStatus: LoadStatus.NotPickedUp,
        }),
      );
    });
  });

  // ── Edge cases ────────────────────────────────────────────────

  describe('processCargoWebhook — event without eventId', () => {
    it('should process events that lack an external event id', async () => {
      const payload = { ...validPayload, eventId: undefined };

      const result = await service.processCargoWebhook(payload);

      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalEventId: null,
        }),
      );
      expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
    });
  });
});

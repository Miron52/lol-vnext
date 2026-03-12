import { CargoWebhookController } from './cargo-webhook.controller';
import { IntegrationEventsService } from './integration-events.service';
import {
  IntegrationEventStatus,
  IntegrationEventResult,
  IntegrationEventDto,
} from '@lol/shared';

describe('CargoWebhookController', () => {
  let controller: CargoWebhookController;
  let service: Partial<IntegrationEventsService>;

  const mockEventDto: IntegrationEventDto = {
    id: 'uuid-event-1',
    sourceSystem: 'cargo',
    externalEventId: 'cargo-evt-001',
    eventType: 'load.created',
    payloadHash: 'abc123',
    payloadJson: {},
    processingStatus: IntegrationEventStatus.Processed,
    processingResult: IntegrationEventResult.Created,
    processingError: null,
    loadId: 'uuid-load-1',
    receivedAt: '2026-03-10T00:00:00.000Z',
    processedAt: '2026-03-10T00:00:01.000Z',
  };

  beforeEach(() => {
    service = {
      processCargoWebhook: jest.fn().mockResolvedValue(mockEventDto),
    };
    controller = new CargoWebhookController(
      service as IntegrationEventsService,
    );
  });

  it('should delegate to IntegrationEventsService', async () => {
    const dto = {
      loadKey: 'CARGO-12345',
      sylNumber: 'TLS26-11-50',
      date: '2026-03-10',
      dispatcherEmail: 'driver@tlslogistics.us',
      businessName: 'Acme',
      fromAddress: 'A',
      fromState: 'TX',
      fromDate: '2026-03-10',
      toAddress: 'B',
      toState: 'MS',
      toDate: '2026-03-11',
      grossAmount: 5000,
      driverCostAmount: 3500,
    };

    const result = await controller.ingest(dto as any);

    expect(service.processCargoWebhook).toHaveBeenCalledWith(dto);
    expect(result.processingStatus).toBe(IntegrationEventStatus.Processed);
    expect(result.loadId).toBe('uuid-load-1');
  });

  it('should return failed event when service reports failure', async () => {
    const failedDto: IntegrationEventDto = {
      ...mockEventDto,
      processingStatus: IntegrationEventStatus.Failed,
      processingResult: IntegrationEventResult.Failed,
      processingError: 'Dispatcher not found',
      loadId: null,
    };
    (service.processCargoWebhook as jest.Mock).mockResolvedValue(failedDto);

    const result = await controller.ingest({} as any);

    expect(result.processingStatus).toBe(IntegrationEventStatus.Failed);
    expect(result.processingError).toBe('Dispatcher not found');
  });
});

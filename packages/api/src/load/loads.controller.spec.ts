import { Test, TestingModule } from '@nestjs/testing';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { LoadStatus } from '@lol/shared';

describe('LoadsController', () => {
  let controller: LoadsController;
  let service: Partial<LoadsService>;

  const mockLoadDto = {
    id: 'uuid-load-1',
    sylNumber: 'TLS26-11-01',
    externalSource: null,
    externalLoadKey: null,
    weekId: 'uuid-w1',
    date: '2026-03-10',
    unitId: null,
    driverId: null,
    dispatcherId: 'uuid-user-1',
    businessName: 'Biz',
    brokerageId: null,
    netsuiteRef: null,
    fromAddress: 'A',
    fromState: 'TX',
    fromDate: '2026-03-10',
    toAddress: 'B',
    toState: 'MS',
    toDate: '2026-03-11',
    miles: 500,
    grossAmount: 5000,
    driverCostAmount: 3500,
    profitAmount: 1500,
    profitPercent: 30,
    quickPayFlag: false,
    directPaymentFlag: false,
    factoringFlag: false,
    driverPaidFlag: false,
    loadStatus: LoadStatus.NotPickedUp,
    comment: null,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
    archivedAt: null,
  };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([mockLoadDto]),
      findById: jest.fn().mockResolvedValue(mockLoadDto),
      create: jest.fn().mockResolvedValue(mockLoadDto),
      update: jest.fn().mockResolvedValue(mockLoadDto),
      archive: jest.fn().mockResolvedValue({ ...mockLoadDto, archivedAt: '2026-03-10T00:00:00.000Z' }),
      unarchive: jest.fn().mockResolvedValue(mockLoadDto),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoadsController],
      providers: [{ provide: LoadsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LoadsController>(LoadsController);
  });

  describe('GET /loads', () => {
    it('should return list of loads', async () => {
      const result = await controller.list();
      expect(result).toHaveLength(1);
      expect(result[0].sylNumber).toBe('TLS26-11-01');
    });

    it('should pass weekId and includeArchived=false by default', async () => {
      await controller.list('uuid-w1');
      expect(service.list).toHaveBeenCalledWith('uuid-w1', false);
    });

    it('should pass includeArchived=true when query param is "true"', async () => {
      await controller.list('uuid-w1', 'true');
      expect(service.list).toHaveBeenCalledWith('uuid-w1', true);
    });

    it('should pass includeArchived=false for non-true string', async () => {
      await controller.list('uuid-w1', 'false');
      expect(service.list).toHaveBeenCalledWith('uuid-w1', false);
    });
  });

  describe('GET /loads/:id', () => {
    it('should return single load', async () => {
      const result = await controller.findById('uuid-load-1');
      expect(result.id).toBe('uuid-load-1');
    });
  });

  describe('POST /loads', () => {
    it('should create and return load with derived fields', async () => {
      const result = await controller.create({} as any);
      expect(result.profitAmount).toBe(1500);
      expect(result.profitPercent).toBe(30);
    });
  });

  describe('PATCH /loads/:id', () => {
    it('should update and return load', async () => {
      const result = await controller.update('uuid-load-1', { comment: 'updated' });
      expect(result.id).toBe('uuid-load-1');
    });
  });

  describe('POST /loads/:id/archive', () => {
    it('should archive and return load with archivedAt', async () => {
      const result = await controller.archive('uuid-load-1');
      expect(service.archive).toHaveBeenCalledWith('uuid-load-1');
      expect(result.archivedAt).not.toBeNull();
    });
  });

  describe('POST /loads/:id/unarchive', () => {
    it('should unarchive and return load with archivedAt=null', async () => {
      const result = await controller.unarchive('uuid-load-1');
      expect(service.unarchive).toHaveBeenCalledWith('uuid-load-1');
      expect(result.archivedAt).toBeNull();
    });
  });
});

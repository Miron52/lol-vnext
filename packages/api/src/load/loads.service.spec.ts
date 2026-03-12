import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { LoadsService, EXPORT_COLUMNS } from './loads.service';
import { Load } from './entities/load.entity';
import { LoadStatus } from '@lol/shared';

describe('LoadsService', () => {
  let service: LoadsService;
  let repo: Partial<Repository<Load>>;

  const mockLoad: Load = {
    id: 'uuid-load-1',
    sylNumber: 'TLS26-11-01',
    externalSource: null,
    externalLoadKey: null,
    weekId: 'uuid-w1',
    week: null as any,
    date: '2026-03-10',
    unitId: null,
    driverId: null,
    dispatcherId: 'uuid-user-1',
    dispatcher: null as any,
    businessName: 'Test Business',
    brokerageId: null,
    netsuiteRef: null,
    fromAddress: 'Dallas, TX 75244',
    fromState: 'TX',
    fromDate: '2026-03-10',
    toAddress: 'Monticello, MS 39654',
    toState: 'MS',
    toDate: '2026-03-11',
    miles: 500,
    grossAmount: 5000,
    driverCostAmount: 3500,
    profitAmount: 1500,
    profitPercent: 30,
    otrAmount: 62.5,
    netProfitAmount: 1437.5,
    quickPayFlag: false,
    directPaymentFlag: false,
    factoringFlag: false,
    driverPaidFlag: false,
    loadStatus: LoadStatus.NotPickedUp,
    comment: null,
    auditSource: 'manual',
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-03-10'),
    archivedAt: null,
  };

  const mockQb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockLoad]),
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'uuid-new', ...data, createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };
    service = new LoadsService(repo as Repository<Load>);
  });

  describe('list', () => {
    it('should return non-archived loads', async () => {
      const result = await service.list();
      expect(result).toHaveLength(1);
      expect(result[0].sylNumber).toBe('TLS26-11-01');
      expect(mockQb.where).toHaveBeenCalledWith('load.archivedAt IS NULL');
    });

    it('should filter by weekId when provided', async () => {
      await service.list('uuid-w1');
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'load.weekId = :weekId',
        { weekId: 'uuid-w1' },
      );
    });
  });

  describe('findById', () => {
    it('should return load when found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockLoad);
      const result = await service.findById('uuid-load-1');
      expect(result.id).toBe('uuid-load-1');
    });

    it('should throw NotFoundException when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should compute derived fields and save', async () => {
      const dto = {
        sylNumber: 'TLS26-11-02',
        weekId: 'uuid-w1',
        date: '2026-03-10',
        dispatcherId: 'uuid-user-1',
        businessName: 'Biz',
        fromAddress: 'A',
        fromState: 'TX',
        fromDate: '2026-03-10',
        toAddress: 'B',
        toState: 'MS',
        toDate: '2026-03-11',
        miles: 100,
        grossAmount: 4000,
        driverCostAmount: 2800,
      };

      const result = await service.create(dto as any);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          profitAmount: 1200,
          profitPercent: 30,
          otrAmount: 50,         // 4000 * 0.0125
          netProfitAmount: 1150, // 1200 - 50
        }),
      );
    });

    it('should throw ConflictException on duplicate sylNumber', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockLoad);
      await expect(
        service.create({ sylNumber: 'TLS26-11-01' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should recompute derived fields when grossAmount changes', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ ...mockLoad });
      await service.update('uuid-load-1', { grossAmount: 6000 });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          grossAmount: 6000,
          profitAmount: 2500,
          profitPercent: 41.67,
          otrAmount: 75,         // 6000 * 0.0125
          netProfitAmount: 2425, // 2500 - 75
        }),
      );
    });

    it('should throw NotFoundException when load does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.update('non-existent', { comment: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Export ────────────────────────────────────────────────

  describe('exportCsv', () => {
    beforeEach(() => {
      // Reset mock for each export test
      mockQb.where.mockClear().mockReturnThis();
      mockQb.andWhere.mockClear().mockReturnThis();
      mockQb.orderBy.mockClear().mockReturnThis();
      mockQb.addOrderBy.mockClear().mockReturnThis();
      mockQb.leftJoinAndSelect.mockClear().mockReturnThis();
      mockQb.getMany.mockClear().mockResolvedValue([mockLoad]);
    });

    it('should throw BadRequestException when weekId is missing', async () => {
      await expect(
        service.exportCsv({ weekId: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return CSV header + data rows', async () => {
      const { csv, count } = await service.exportCsv({ weekId: 'uuid-w1' });

      expect(count).toBe(1);

      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(2); // header + 1 data row

      // Verify header matches EXPORT_COLUMNS
      expect(lines[0]).toBe(EXPORT_COLUMNS.join(','));

      // Verify data row contains expected values
      expect(lines[1]).toContain('TLS26-11-01');
      expect(lines[1]).toContain('5000');
      expect(lines[1]).toContain('3500');
      expect(lines[1]).toContain('1500');
    });

    it('should return header-only CSV when no loads match', async () => {
      mockQb.getMany.mockResolvedValue([]);

      const { csv, count } = await service.exportCsv({ weekId: 'uuid-w1' });

      expect(count).toBe(0);
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1); // header only
      expect(lines[0]).toBe(EXPORT_COLUMNS.join(','));
    });

    it('should always filter by archived and weekId', async () => {
      await service.exportCsv({ weekId: 'uuid-w1' });

      expect(mockQb.where).toHaveBeenCalledWith('load.archivedAt IS NULL');
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'load.weekId = :weekId',
        { weekId: 'uuid-w1' },
      );
    });

    it('should apply quick_pay payment filter', async () => {
      await service.exportCsv({ weekId: 'uuid-w1', paymentFilter: 'quick_pay' });

      expect(mockQb.andWhere).toHaveBeenCalledWith('load.quickPayFlag = true');
    });

    it('should apply direct payment filter', async () => {
      await service.exportCsv({ weekId: 'uuid-w1', paymentFilter: 'direct' });

      expect(mockQb.andWhere).toHaveBeenCalledWith('load.directPaymentFlag = true');
    });

    it('should apply onlyUnpaid filter', async () => {
      await service.exportCsv({ weekId: 'uuid-w1', onlyUnpaid: true });

      expect(mockQb.andWhere).toHaveBeenCalledWith('load.driverPaidFlag = false');
    });

    it('should apply excludeBrokers filter', async () => {
      await service.exportCsv({ weekId: 'uuid-w1', excludeBrokers: true });

      expect(mockQb.andWhere).toHaveBeenCalledWith('load.brokerageId IS NULL');
    });

    it('should escape CSV values containing commas', async () => {
      const loadWithComma = {
        ...mockLoad,
        businessName: 'Acme, Inc.',
        fromAddress: 'Dallas, TX 75244',
      };
      mockQb.getMany.mockResolvedValue([loadWithComma]);

      const { csv } = await service.exportCsv({ weekId: 'uuid-w1' });

      // Commas in values should be wrapped in quotes
      expect(csv).toContain('"Acme, Inc."');
      expect(csv).toContain('"Dallas, TX 75244"');
    });
  });

  // ── Archive hardening ──────────────────────────────────────

  describe('update (archive guard)', () => {
    it('should throw ForbiddenException when load is archived', async () => {
      const archivedLoad = { ...mockLoad, archivedAt: new Date('2026-03-01') };
      (repo.findOne as jest.Mock).mockResolvedValue(archivedLoad);

      await expect(
        service.update('uuid-load-1', { comment: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow update when load is not archived', async () => {
      const activeLoad = { ...mockLoad, archivedAt: null };
      (repo.findOne as jest.Mock).mockResolvedValue(activeLoad);

      await service.update('uuid-load-1', { comment: 'updated' });
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should set archivedAt on active load', async () => {
      const activeLoad = { ...mockLoad, archivedAt: null };
      (repo.findOne as jest.Mock).mockResolvedValue(activeLoad);

      const result = await service.archive('uuid-load-1');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ archivedAt: expect.any(Date) }),
      );
      expect(result.archivedAt).not.toBeNull();
    });

    it('should throw BadRequestException when already archived', async () => {
      const archivedLoad = { ...mockLoad, archivedAt: new Date() };
      (repo.findOne as jest.Mock).mockResolvedValue(archivedLoad);

      await expect(service.archive('uuid-load-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when load does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.archive('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unarchive', () => {
    it('should clear archivedAt on archived load', async () => {
      const archivedLoad = { ...mockLoad, archivedAt: new Date() };
      (repo.findOne as jest.Mock).mockResolvedValue(archivedLoad);

      const result = await service.unarchive('uuid-load-1');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ archivedAt: null }),
      );
      expect(result.archivedAt).toBeNull();
    });

    it('should throw BadRequestException when not archived', async () => {
      const activeLoad = { ...mockLoad, archivedAt: null };
      (repo.findOne as jest.Mock).mockResolvedValue(activeLoad);

      await expect(service.unarchive('uuid-load-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when load does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.unarchive('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list (includeArchived)', () => {
    beforeEach(() => {
      mockQb.where.mockClear().mockReturnThis();
      mockQb.andWhere.mockClear().mockReturnThis();
      mockQb.orderBy.mockClear().mockReturnThis();
      mockQb.getMany.mockClear().mockResolvedValue([mockLoad]);
    });

    it('should filter out archived loads by default', async () => {
      await service.list('uuid-w1');
      expect(mockQb.where).toHaveBeenCalledWith('load.archivedAt IS NULL');
    });

    it('should not filter archived loads when includeArchived=true', async () => {
      await service.list('uuid-w1', true);
      expect(mockQb.where).not.toHaveBeenCalledWith('load.archivedAt IS NULL');
    });
  });
});

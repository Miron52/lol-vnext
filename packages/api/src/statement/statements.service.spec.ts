import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StatementsService } from './statements.service';
import { Statement } from './entities/statement.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { LoadStatus } from '@lol/shared';

describe('StatementsService', () => {
  let service: StatementsService;
  let statementsRepo: Partial<Repository<Statement>>;
  let loadsRepo: Partial<Repository<Load>>;
  let weeksRepo: Partial<Repository<Week>>;
  let usersRepo: Partial<Repository<User>>;

  const mockWeek: Partial<Week> = {
    id: 'w1',
    label: 'LS2026-11',
    isoYear: 2026,
    isoWeek: 11,
    startDate: '2026-03-09',
    endDate: '2026-03-15',
  };

  const mockUser: Partial<User> = {
    id: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
  };

  const mockLoad: Load = {
    id: 'load-1',
    sylNumber: 'TLS26-11-01',
    externalSource: null,
    externalLoadKey: null,
    weekId: 'w1',
    week: null as any,
    date: '2026-03-10',
    unitId: null,
    driverId: null,
    dispatcherId: 'u1',
    dispatcher: null as any,
    businessName: 'Biz',
    brokerageId: null,
    netsuiteRef: null,
    fromAddress: 'Dallas, TX',
    fromState: 'TX',
    fromDate: '2026-03-10',
    toAddress: 'Jackson, MS',
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

  const loadsQb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockLoad]),
  };

  beforeEach(() => {
    loadsQb.where.mockClear().mockReturnThis();
    loadsQb.andWhere.mockClear().mockReturnThis();
    loadsQb.orderBy.mockClear().mockReturnThis();
    loadsQb.addOrderBy.mockClear().mockReturnThis();
    loadsQb.getMany.mockClear().mockResolvedValue([mockLoad]);

    statementsRepo = {
      create: jest.fn().mockImplementation((data) => ({
        id: 'stmt-1',
        ...data,
        generatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    loadsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(loadsQb),
    };
    weeksRepo = {
      findOne: jest.fn().mockResolvedValue(mockWeek),
    };
    usersRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    service = new StatementsService(
      statementsRepo as Repository<Statement>,
      loadsRepo as Repository<Load>,
      weeksRepo as Repository<Week>,
      usersRepo as Repository<User>,
    );
  });

  describe('preview', () => {
    it('should return a statement preview with empty id', async () => {
      const result = await service.preview(
        { statementType: 'driver', weekId: 'w1' },
        'u1',
      );

      expect(result.id).toBe('');
      expect(result.statementType).toBe('driver');
      expect(result.weekLabel).toBe('LS2026-11');
      expect(result.generatedByName).toBe('John Doe');
      expect(result.snapshot.loads).toHaveLength(1);
      expect(result.snapshot.totals.loadCount).toBe(1);
      expect(result.snapshot.totals.grossAmount).toBe(5000);
      expect(result.snapshot.totals.netProfitAmount).toBe(1437.5);
    });

    it('should throw when week not found', async () => {
      (weeksRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.preview({ statementType: 'driver', weekId: 'bad' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when user not found', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.preview({ statementType: 'driver', weekId: 'w1' }, 'bad'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generate', () => {
    it('should persist a statement and return it with id', async () => {
      const result = await service.generate(
        { statementType: 'owner', weekId: 'w1' },
        'u1',
      );

      expect(statementsRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('stmt-1');
      expect(result.statementType).toBe('owner');
      expect(result.snapshot.loads).toHaveLength(1);
    });
  });

  describe('filters', () => {
    it('should exclude archived loads', async () => {
      await service.preview({ statementType: 'driver', weekId: 'w1' }, 'u1');
      expect(loadsQb.where).toHaveBeenCalledWith('load.archivedAt IS NULL');
    });

    it('should filter by weekId', async () => {
      await service.preview({ statementType: 'driver', weekId: 'w1' }, 'u1');
      expect(loadsQb.andWhere).toHaveBeenCalledWith(
        'load.weekId = :weekId',
        { weekId: 'w1' },
      );
    });

    it('should apply quick_pay filter', async () => {
      await service.preview(
        { statementType: 'driver', weekId: 'w1', paymentFilter: 'quick_pay' },
        'u1',
      );
      expect(loadsQb.andWhere).toHaveBeenCalledWith('load.quickPayFlag = true');
    });

    it('should apply onlyUnpaid filter using driverPaidFlag', async () => {
      await service.preview(
        { statementType: 'driver', weekId: 'w1', onlyUnpaid: true },
        'u1',
      );
      expect(loadsQb.andWhere).toHaveBeenCalledWith('load.driverPaidFlag = false');
    });

    it('should apply unitId filter', async () => {
      await service.preview(
        { statementType: 'driver', weekId: 'w1', unitId: 'unit-1' },
        'u1',
      );
      expect(loadsQb.andWhere).toHaveBeenCalledWith(
        'load.unitId = :unitId',
        { unitId: 'unit-1' },
      );
    });
  });

  describe('listArchive', () => {
    it('should return archive items', async () => {
      (statementsRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 'stmt-1',
          statementType: 'driver',
          weekId: 'w1',
          weekLabel: 'LS2026-11',
          unitId: null,
          loadCount: 3,
          totalGross: 15000,
          totalNetProfit: 12000,
          generatedAt: new Date('2026-03-12'),
          generatedByName: 'John Doe',
        },
      ]);

      const result = await service.listArchive();
      expect(result).toHaveLength(1);
      expect(result[0].weekLabel).toBe('LS2026-11');
      expect(result[0].loadCount).toBe(3);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when not found', async () => {
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return statement when found', async () => {
      (statementsRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'stmt-1',
        statementType: 'driver',
        weekId: 'w1',
        weekLabel: 'LS2026-11',
        unitId: null,
        generatedAt: new Date('2026-03-12'),
        generatedById: 'u1',
        generatedByName: 'John Doe',
        snapshot: { loads: [], totals: { loadCount: 0, grossAmount: 0, driverCostAmount: 0, profitAmount: 0, otrAmount: 0, netProfitAmount: 0 } },
      });

      const result = await service.findById('stmt-1');
      expect(result.id).toBe('stmt-1');
    });
  });
});

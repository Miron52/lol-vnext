import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SalaryService } from './salary.service';
import { SalaryRecord } from './entities/salary-record.entity';
import { SalaryWeekState } from './entities/salary-week-state.entity';
import { SalaryAuditLog } from './entities/salary-audit-log.entity';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import { User } from '../identity/entities/user.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { Role } from '@lol/shared';

describe('SalaryService', () => {
  let service: SalaryService;
  let salaryRepo: Partial<Repository<SalaryRecord>>;
  let weekStateRepo: Partial<Repository<SalaryWeekState>>;
  let auditRepo: Partial<Repository<SalaryAuditLog>>;
  let loadsRepo: Partial<Repository<Load>>;
  let weeksRepo: Partial<Repository<Week>>;
  let usersRepo: Partial<Repository<User>>;
  let rulesRepo: Partial<Repository<SalaryRule>>;

  const mockWeek: Partial<Week> = {
    id: 'w1',
    label: 'LS2026-11',
    isoYear: 2026,
    isoWeek: 11,
    startDate: '2026-03-09',
    endDate: '2026-03-15',
  };

  const mockDispatcher: Partial<User> = {
    id: 'disp-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@test.com',
    role: Role.Dispatcher,
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    role: Role.Admin,
  };

  const mockRule: Partial<SalaryRule> = {
    id: 'rule-1',
    name: 'Standard Tiers',
    version: 3,
    isActive: true,
    tiers: [
      { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 },
      { tierOrder: 2, minProfit: 5000, maxProfit: 15000, percent: 12 },
      { tierOrder: 3, minProfit: 15000, maxProfit: null, percent: 15 },
    ],
  };

  const makeLoad = (id: string, profitAmount: number): Partial<Load> => ({
    id,
    sylNumber: `TLS-${id}`,
    weekId: 'w1',
    dispatcherId: 'disp-1',
    date: '2026-03-10',
    fromAddress: 'Dallas, TX',
    toAddress: 'Jackson, MS',
    grossAmount: profitAmount + 1000,
    driverCostAmount: 1000,
    profitAmount,
    archivedAt: null,
  });

  beforeEach(() => {
    salaryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ ...data, id: 'sal-1', generatedAt: new Date() })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'sal-1', generatedAt: entity.generatedAt || new Date() })),
    };

    weekStateRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
    };

    auditRepo = {
      create: jest.fn().mockImplementation((data) => ({ ...data, id: 'audit-1', createdAt: new Date() })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
    };

    loadsRepo = {
      find: jest.fn().mockResolvedValue([
        makeLoad('l1', 3000),
        makeLoad('l2', 4200),
      ]),
    };

    weeksRepo = {
      findOne: jest.fn().mockResolvedValue(mockWeek),
    };

    usersRepo = {
      find: jest.fn().mockResolvedValue([mockDispatcher]),
      findOne: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'disp-1') return Promise.resolve(mockDispatcher);
        if (where.id === 'admin-1') return Promise.resolve(mockAdmin);
        return Promise.resolve(null);
      }),
    };

    rulesRepo = {
      findOne: jest.fn().mockResolvedValue(mockRule),
    };

    service = new SalaryService(
      salaryRepo as Repository<SalaryRecord>,
      weekStateRepo as Repository<SalaryWeekState>,
      auditRepo as Repository<SalaryAuditLog>,
      loadsRepo as Repository<Load>,
      weeksRepo as Repository<Week>,
      usersRepo as Repository<User>,
      rulesRepo as Repository<SalaryRule>,
    );
  });

  // ── Preview ──

  describe('previewWeek', () => {
    it('should return preview rows for all dispatchers', async () => {
      const rows = await service.previewWeek('w1');
      expect(rows).toHaveLength(1);
      expect(rows[0].dispatcherName).toBe('Jane Doe');
      expect(rows[0].isGenerated).toBe(false);
      expect(rows[0].weeklyGrossProfit).toBe(7200); // 3000 + 4200
    });

    it('should apply correct tier (tier 2 for $7,200)', async () => {
      const rows = await service.previewWeek('w1');
      expect(rows[0].appliedPercent).toBe(12); // $5k-$15k bracket
      expect(rows[0].baseSalary).toBe(864); // 7200 * 0.12
    });

    it('should throw when week not found', async () => {
      (weeksRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.previewWeek('bad')).rejects.toThrow(NotFoundException);
    });

    it('should throw when no active rule set', async () => {
      (rulesRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.previewWeek('w1')).rejects.toThrow(BadRequestException);
    });

    it('should use persisted record when it exists', async () => {
      const mockRecord: Partial<SalaryRecord> = {
        id: 'sal-existing',
        dispatcherId: 'disp-1',
        dispatcherName: 'Jane Doe',
        weekId: 'w1',
        weekLabel: 'LS2026-11',
        weeklyGrossProfit: 5000,
        appliedPercent: 10,
        baseSalary: 500,
        totalOther: -50,
        totalBonus: 100,
        totalSalary: 550,
        ruleVersion: 2,
        loadCount: 4,
        generatedByName: 'Admin User',
        generatedAt: new Date(),
        snapshot: {
          adjustments: [
            { type: 'other', amount: -50, note: 'deduction', createdBy: 'Admin User', createdAt: '2026-03-12T00:00:00.000Z' },
            { type: 'bonus', amount: 100, note: 'performance', createdBy: 'Admin User', createdAt: '2026-03-12T00:00:00.000Z' },
          ],
        } as any,
      };
      (salaryRepo.find as jest.Mock).mockResolvedValue([mockRecord]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].isGenerated).toBe(true);
      expect(rows[0].id).toBe('sal-existing');
    });

    it('should clamp negative profit to $0 base salary', async () => {
      (loadsRepo.find as jest.Mock).mockResolvedValue([makeLoad('l1', -500)]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].weeklyGrossProfit).toBe(-500);
      expect(rows[0].baseSalary).toBe(0);
      expect(rows[0].appliedPercent).toBe(10); // tier 1 still recorded
    });

    it('should handle zero loads for dispatcher', async () => {
      (loadsRepo.find as jest.Mock).mockResolvedValue([]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].weeklyGrossProfit).toBe(0);
      expect(rows[0].baseSalary).toBe(0);
      expect(rows[0].loadCount).toBe(0);
    });
  });

  // ── Generate ──

  describe('generate', () => {
    it('should persist a salary record with snapshot', async () => {
      const result = await service.generate('w1', 'disp-1', [], 'admin-1');
      expect(salaryRepo.save).toHaveBeenCalled();
      expect(result.isGenerated).toBe(true);
      expect(result.ruleVersion).toBe(3);
      expect(result.weeklyGrossProfit).toBe(7200);
      expect(result.baseSalary).toBe(864);
    });

    it('should include adjustments in snapshot', async () => {
      const adjustments = [
        { type: 'other' as const, amount: -50, note: 'Uniform cost' },
        { type: 'bonus' as const, amount: 100, note: 'Top performer' },
      ];
      const result = await service.generate('w1', 'disp-1', adjustments, 'admin-1');
      expect(result.totalOther).toBe(-50);
      expect(result.totalBonus).toBe(100);
      expect(result.totalSalary).toBe(914); // 864 + (-50) + 100
    });

    it('should store rule_version and applied_percent in snapshot', async () => {
      await service.generate('w1', 'disp-1', [], 'admin-1');
      // First save call is the salary record (after potential existing record save)
      const saveCalls = (salaryRepo.save as jest.Mock).mock.calls;
      const savedArg = saveCalls[saveCalls.length - 1][0];
      expect(savedArg.snapshot.ruleVersion).toBe(3);
      expect(savedArg.snapshot.appliedPercent).toBe(12);
      expect(savedArg.snapshot.tiers).toHaveLength(3);
    });

    it('should stamp createdBy and createdAt on each adjustment (audit trail)', async () => {
      const adjustments = [
        { type: 'other' as const, amount: -50, note: 'Uniform cost' },
        { type: 'bonus' as const, amount: 100, note: 'Top performer' },
      ];
      await service.generate('w1', 'disp-1', adjustments, 'admin-1');
      const saveCalls = (salaryRepo.save as jest.Mock).mock.calls;
      const savedArg = saveCalls[saveCalls.length - 1][0];
      const snapshotAdj = savedArg.snapshot.adjustments;
      expect(snapshotAdj).toHaveLength(2);
      for (const adj of snapshotAdj) {
        expect(adj.createdBy).toBe('Admin User');
        expect(adj.createdAt).toBeDefined();
        expect(new Date(adj.createdAt).toISOString()).toBe(adj.createdAt);
      }
    });

    it('should reject bonus with negative amount', async () => {
      const bad = [{ type: 'bonus' as const, amount: -100, note: 'bad' }];
      await expect(service.generate('w1', 'disp-1', bad, 'admin-1')).rejects.toThrow('Bonus must be >= 0');
    });

    it('should reject adjustment without note', async () => {
      const bad = [{ type: 'other' as const, amount: 50, note: '' }];
      await expect(service.generate('w1', 'disp-1', bad, 'admin-1')).rejects.toThrow('note');
    });

    it('should throw for unknown dispatcher', async () => {
      await expect(service.generate('w1', 'unknown', [], 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw for unknown user', async () => {
      await expect(service.generate('w1', 'disp-1', [], 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when week is frozen', async () => {
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue({ weekId: 'w1', status: 'frozen' });
      await expect(service.generate('w1', 'disp-1', [], 'admin-1')).rejects.toThrow(ForbiddenException);
    });

    it('should create audit entry on generate', async () => {
      await service.generate('w1', 'disp-1', [], 'admin-1');
      expect(auditRepo.save).toHaveBeenCalled();
      const auditArg = (auditRepo.create as jest.Mock).mock.calls[0][0];
      expect(auditArg.action).toBe('generate');
      expect(auditArg.weekId).toBe('w1');
    });

    it('should increment revision when re-generating existing record', async () => {
      const existingRecord: Partial<SalaryRecord> = {
        id: 'sal-old',
        weekId: 'w1',
        dispatcherId: 'disp-1',
        revision: 1,
        isCurrent: true,
      };
      (salaryRepo.findOne as jest.Mock).mockResolvedValue(existingRecord);

      await service.generate('w1', 'disp-1', [], 'admin-1');

      // Old record should be marked not current
      expect(existingRecord.isCurrent).toBe(false);

      // New record should have revision 2
      const saveCalls = (salaryRepo.save as jest.Mock).mock.calls;
      const lastSaved = saveCalls[saveCalls.length - 1][0];
      expect(lastSaved.revision).toBe(2);
      expect(lastSaved.isCurrent).toBe(true);
    });
  });

  // ── Freeze / Unfreeze ──

  describe('freezeWeek', () => {
    it('should throw when week not found', async () => {
      (weeksRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.freezeWeek('bad', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw when trying to freeze an open week', async () => {
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue({ weekId: 'w1', status: 'open' });
      await expect(service.freezeWeek('w1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when already frozen', async () => {
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue({ weekId: 'w1', status: 'frozen' });
      await expect(service.freezeWeek('w1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should freeze a generated week', async () => {
      const state = { weekId: 'w1', status: 'generated' as const };
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue(state);

      await service.freezeWeek('w1', 'admin-1');

      expect(state.status).toBe('frozen');
      expect(weekStateRepo.save).toHaveBeenCalled();
      expect(auditRepo.save).toHaveBeenCalled();
    });
  });

  describe('unfreezeWeek', () => {
    it('should throw when not frozen', async () => {
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue({ weekId: 'w1', status: 'generated' });
      await expect(service.unfreezeWeek('w1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should unfreeze to generated', async () => {
      const state = { weekId: 'w1', status: 'frozen' as const, frozenAt: new Date(), frozenById: 'admin-1', frozenByName: 'Admin User' };
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue(state);

      await service.unfreezeWeek('w1', 'admin-1');

      expect(state.status).toBe('generated');
      expect(state.frozenAt).toBeNull();
      expect(auditRepo.save).toHaveBeenCalled();
    });
  });

  // ── Recalculate ──

  describe('recalculateWeek', () => {
    it('should throw when no existing records', async () => {
      (salaryRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.recalculateWeek('w1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when week is frozen', async () => {
      (weekStateRepo.findOne as jest.Mock).mockResolvedValue({ weekId: 'w1', status: 'frozen' });
      await expect(service.recalculateWeek('w1', 'admin-1')).rejects.toThrow(ForbiddenException);
    });

    it('should recalculate and increment revision', async () => {
      const existingRecord: Partial<SalaryRecord> = {
        id: 'sal-old',
        weekId: 'w1',
        dispatcherId: 'disp-1',
        dispatcherName: 'Jane Doe',
        revision: 1,
        isCurrent: true,
        snapshot: {
          adjustments: [
            { type: 'bonus' as const, amount: 100, note: 'perf', createdBy: 'Admin User', createdAt: '2026-03-12T00:00:00.000Z' },
          ],
        } as any,
      };
      (salaryRepo.find as jest.Mock).mockResolvedValue([existingRecord]);

      const rows = await service.recalculateWeek('w1', 'admin-1');

      expect(rows).toHaveLength(1);
      expect(existingRecord.isCurrent).toBe(false);
      expect(auditRepo.save).toHaveBeenCalled();
    });
  });

  // ── Audit log ──

  describe('getAuditLog', () => {
    it('should return empty array for no logs', async () => {
      const logs = await service.getAuditLog('w1');
      expect(logs).toEqual([]);
    });

    it('should return formatted audit entries', async () => {
      const mockLog = {
        id: 'log-1',
        weekId: 'w1',
        action: 'generate',
        performedByName: 'Admin User',
        detail: 'Generated salary',
        createdAt: new Date('2026-03-12T10:00:00Z'),
      };
      (auditRepo.find as jest.Mock).mockResolvedValue([mockLog]);
      const logs = await service.getAuditLog('w1');
      expect(logs).toHaveLength(1);
      expect(logs[0].createdAt).toBe('2026-03-12T10:00:00.000Z');
    });
  });

  // ── Find by ID ──

  describe('findById', () => {
    it('should throw when not found', async () => {
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });

    it('should return record with snapshot', async () => {
      const mockRecord: Partial<SalaryRecord> = {
        id: 'sal-1',
        dispatcherId: 'disp-1',
        dispatcherName: 'Jane Doe',
        weekId: 'w1',
        weekLabel: 'LS2026-11',
        snapshot: { ruleVersion: 3 } as any,
        generatedById: 'admin-1',
        generatedByName: 'Admin User',
        generatedAt: new Date('2026-03-12T00:00:00Z'),
      };
      (salaryRepo.findOne as jest.Mock).mockResolvedValue(mockRecord);
      const result = await service.findById('sal-1');
      expect(result.id).toBe('sal-1');
      expect(result.snapshot.ruleVersion).toBe(3);
    });
  });

  // ── Tier matching ──

  describe('tier matching', () => {
    it('should match tier 1 for profit $3,000', async () => {
      (loadsRepo.find as jest.Mock).mockResolvedValue([makeLoad('l1', 3000)]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].appliedPercent).toBe(10);
    });

    it('should match tier 3 for profit $20,000', async () => {
      (loadsRepo.find as jest.Mock).mockResolvedValue([makeLoad('l1', 20000)]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].appliedPercent).toBe(15);
      expect(rows[0].baseSalary).toBe(3000); // 20000 * 0.15
    });

    it('should match tier 2 at boundary $5,000 [min inclusive, max exclusive)', async () => {
      (loadsRepo.find as jest.Mock).mockResolvedValue([makeLoad('l1', 5000)]);
      const rows = await service.previewWeek('w1');
      expect(rows[0].appliedPercent).toBe(12);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SalaryRulesService } from './salary-rules.service';
import { SalaryRule } from './entities/salary-rule.entity';
import { User } from '../identity/entities/user.entity';

describe('SalaryRulesService', () => {
  let service: SalaryRulesService;
  let rulesRepo: Partial<Repository<SalaryRule>>;
  let usersRepo: Partial<Repository<User>>;

  const mockUser: Partial<User> = {
    id: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
  };

  const validTiers = [
    { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 },
    { tierOrder: 2, minProfit: 5000, maxProfit: 15000, percent: 12 },
    { tierOrder: 3, minProfit: 15000, maxProfit: null, percent: 15 },
  ];

  const mockRule: Partial<SalaryRule> = {
    id: 'rule-1',
    name: 'Standard Tiers',
    version: 1,
    isActive: false,
    effectiveFrom: '2026-03-01',
    applicationMode: 'flat_rate',
    salaryBase: 'gross_profit',
    tiers: validTiers as any,
    createdById: 'u1',
    createdByName: 'John Doe',
    createdAt: new Date('2026-03-01T00:00:00Z'),
  };

  beforeEach(() => {
    rulesRepo = {
      find: jest.fn().mockResolvedValue([mockRule]),
      findOne: jest.fn().mockResolvedValue(mockRule),
      create: jest.fn().mockImplementation((data) => ({ ...mockRule, ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ ...mockRule, ...entity, id: entity.id || 'new-id' }),
      ),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };

    usersRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    service = new SalaryRulesService(
      rulesRepo as Repository<SalaryRule>,
      usersRepo as Repository<User>,
    );
  });

  // ── List ──

  it('should list all rule sets', async () => {
    const items = await service.list();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Standard Tiers');
    expect(items[0].tierCount).toBe(3);
  });

  // ── Get active ──

  it('should return null when no active rule set', async () => {
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.getActive();
    expect(result).toBeNull();
  });

  it('should return the active rule set', async () => {
    const activeRule = { ...mockRule, isActive: true };
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(activeRule);
    const result = await service.getActive();
    expect(result).not.toBeNull();
    expect(result!.isActive).toBe(true);
  });

  // ── Find by ID ──

  it('should throw NotFoundException for unknown ID', async () => {
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
  });

  // ── Create ──

  it('should create a new rule set with version 1', async () => {
    const dto = { name: 'New Tiers', effectiveFrom: '2026-04-01', tiers: validTiers };
    const result = await service.create(dto as any, 'u1');
    expect(result.version).toBe(1);
    expect(result.isActive).toBe(false);
    expect(result.applicationMode).toBe('flat_rate');
    expect(result.salaryBase).toBe('gross_profit');
  });

  it('should throw NotFoundException for unknown user on create', async () => {
    (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
    const dto = { name: 'X', effectiveFrom: '2026-04-01', tiers: validTiers };
    await expect(service.create(dto as any, 'bad')).rejects.toThrow(NotFoundException);
  });

  // ── Update ──

  it('should create a new version on update', async () => {
    const dto = { name: 'Updated Tiers' };
    const result = await service.update('rule-1', dto as any, 'u1');
    expect(result.version).toBe(2);
    expect(result.name).toBe('Updated Tiers');
  });

  it('should throw NotFoundException for unknown rule on update', async () => {
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.update('bad', {} as any, 'u1')).rejects.toThrow(NotFoundException);
  });

  // ── Activate ──

  it('should activate a rule set and deactivate others', async () => {
    const inactiveRule = { ...mockRule, isActive: false };
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(inactiveRule);
    const result = await service.activate('rule-1');
    expect(result.isActive).toBe(true);
    // verify createQueryBuilder was called to deactivate others
    expect(rulesRepo.createQueryBuilder).toHaveBeenCalled();
  });

  // ── Deactivate ──

  it('should deactivate a rule set', async () => {
    const activeRule = { ...mockRule, isActive: true };
    (rulesRepo.findOne as jest.Mock).mockResolvedValue(activeRule);
    const result = await service.deactivate('rule-1');
    expect(result.isActive).toBe(false);
  });

  // ── Tier validation ──

  it('should reject empty tiers', () => {
    expect(() => service.validateAndNormalizeTiers([])).toThrow(BadRequestException);
  });

  it('should reject tiers that do not start at 0', () => {
    const bad = [{ tierOrder: 1, minProfit: 100, maxProfit: null, percent: 10 }];
    expect(() => service.validateAndNormalizeTiers(bad as any)).toThrow('minProfit = 0');
  });

  it('should reject last tier with non-null maxProfit', () => {
    const bad = [{ tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 }];
    expect(() => service.validateAndNormalizeTiers(bad as any)).toThrow('null');
  });

  it('should reject non-contiguous tiers', () => {
    const bad = [
      { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 },
      { tierOrder: 2, minProfit: 6000, maxProfit: null, percent: 15 },
    ];
    expect(() => service.validateAndNormalizeTiers(bad as any)).toThrow('contiguous');
  });

  it('should reject maxProfit <= minProfit', () => {
    const bad = [
      { tierOrder: 1, minProfit: 0, maxProfit: 0, percent: 10 },
      { tierOrder: 2, minProfit: 0, maxProfit: null, percent: 15 },
    ];
    expect(() => service.validateAndNormalizeTiers(bad as any)).toThrow('greater than');
  });

  it('should reject percent > 100', () => {
    const bad = [{ tierOrder: 1, minProfit: 0, maxProfit: null, percent: 150 }];
    expect(() => service.validateAndNormalizeTiers(bad as any)).toThrow('between 0 and 100');
  });

  it('should accept valid 3-tier configuration', () => {
    const result = service.validateAndNormalizeTiers(validTiers as any);
    expect(result).toHaveLength(3);
    expect(result[0].minProfit).toBe(0);
    expect(result[2].maxProfit).toBeNull();
  });

  it('should accept a single tier (min=0, max=null)', () => {
    const single = [{ tierOrder: 1, minProfit: 0, maxProfit: null, percent: 10 }];
    const result = service.validateAndNormalizeTiers(single as any);
    expect(result).toHaveLength(1);
  });

  it('should sort tiers by tierOrder', () => {
    const unsorted = [
      { tierOrder: 3, minProfit: 15000, maxProfit: null, percent: 15 },
      { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 },
      { tierOrder: 2, minProfit: 5000, maxProfit: 15000, percent: 12 },
    ];
    const result = service.validateAndNormalizeTiers(unsorted as any);
    expect(result[0].tierOrder).toBe(1);
    expect(result[1].tierOrder).toBe(2);
    expect(result[2].tierOrder).toBe(3);
  });
});

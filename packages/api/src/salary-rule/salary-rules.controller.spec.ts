import { Test } from '@nestjs/testing';
import { SalaryRulesController } from './salary-rules.controller';
import { SalaryRulesService } from './salary-rules.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';

describe('SalaryRulesController', () => {
  let controller: SalaryRulesController;
  let service: Partial<SalaryRulesService>;

  const mockRuleDto = {
    id: 'rule-1',
    name: 'Standard Tiers',
    version: 1,
    isActive: true,
    effectiveFrom: '2026-03-01',
    applicationMode: 'flat_rate' as const,
    salaryBase: 'gross_profit' as const,
    tiers: [
      { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 10 },
      { tierOrder: 2, minProfit: 5000, maxProfit: null, percent: 15 },
    ],
    createdById: 'u1',
    createdByName: 'John Doe',
    createdAt: '2026-03-01T00:00:00.000Z',
  };

  const mockListItem = {
    id: 'rule-1',
    name: 'Standard Tiers',
    version: 1,
    isActive: true,
    effectiveFrom: '2026-03-01',
    tierCount: 2,
    createdByName: 'John Doe',
    createdAt: '2026-03-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([mockListItem]),
      getActive: jest.fn().mockResolvedValue(mockRuleDto),
      findById: jest.fn().mockResolvedValue(mockRuleDto),
      create: jest.fn().mockResolvedValue(mockRuleDto),
      update: jest.fn().mockResolvedValue({ ...mockRuleDto, version: 2 }),
      activate: jest.fn().mockResolvedValue(mockRuleDto),
      deactivate: jest.fn().mockResolvedValue({ ...mockRuleDto, isActive: false }),
    };

    const module = await Test.createTestingModule({
      controllers: [SalaryRulesController],
      providers: [{ provide: SalaryRulesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SalaryRulesController);
  });

  it('should list rule sets', async () => {
    const result = await controller.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Standard Tiers');
  });

  it('should get active rule set', async () => {
    const result = await controller.getActive();
    expect(result).not.toBeNull();
    expect(result!.isActive).toBe(true);
  });

  it('should find rule by ID', async () => {
    const result = await controller.findById('rule-1');
    expect(result.id).toBe('rule-1');
  });

  it('should create a rule set', async () => {
    const dto = { name: 'New', effectiveFrom: '2026-04-01', tiers: [] };
    const req = { user: { id: 'u1' } };
    const result = await controller.create(dto as any, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
    expect(result.name).toBe('Standard Tiers');
  });

  it('should update a rule set', async () => {
    const dto = { name: 'Updated' };
    const req = { user: { id: 'u1' } };
    const result = await controller.update('rule-1', dto as any, req);
    expect(service.update).toHaveBeenCalledWith('rule-1', dto, 'u1');
    expect(result.version).toBe(2);
  });

  it('should activate a rule set', async () => {
    const result = await controller.activate('rule-1');
    expect(service.activate).toHaveBeenCalledWith('rule-1');
    expect(result.isActive).toBe(true);
  });

  it('should deactivate a rule set', async () => {
    const result = await controller.deactivate('rule-1');
    expect(service.deactivate).toHaveBeenCalledWith('rule-1');
    expect(result.isActive).toBe(false);
  });
});

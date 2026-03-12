import { Test } from '@nestjs/testing';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';

describe('SalaryController', () => {
  let controller: SalaryController;
  let service: Partial<SalaryService>;

  const mockRow = {
    id: 'sal-1',
    dispatcherId: 'disp-1',
    dispatcherName: 'Jane Doe',
    weekId: 'w1',
    weekLabel: 'LS2026-11',
    weeklyGrossProfit: 7200,
    appliedPercent: 12,
    baseSalary: 864,
    adjustments: [],
    totalOther: 0,
    totalBonus: 0,
    totalSalary: 864,
    ruleVersion: 3,
    loadCount: 8,
    isGenerated: true,
    generatedAt: '2026-03-12T00:00:00.000Z',
    generatedByName: 'Admin User',
  };

  const mockRecord = {
    id: 'sal-1',
    dispatcherId: 'disp-1',
    dispatcherName: 'Jane Doe',
    weekId: 'w1',
    weekLabel: 'LS2026-11',
    snapshot: { ruleVersion: 3, appliedPercent: 12 },
    generatedById: 'admin-1',
    generatedByName: 'Admin User',
    generatedAt: '2026-03-12T00:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      previewWeek: jest.fn().mockResolvedValue([mockRow]),
      generate: jest.fn().mockResolvedValue(mockRow),
      findById: jest.fn().mockResolvedValue(mockRecord),
    };

    const module = await Test.createTestingModule({
      controllers: [SalaryController],
      providers: [{ provide: SalaryService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SalaryController);
  });

  it('should preview week salary rows', async () => {
    const result = await controller.previewWeek('w1');
    expect(result).toHaveLength(1);
    expect(result[0].dispatcherName).toBe('Jane Doe');
    expect(service.previewWeek).toHaveBeenCalledWith('w1');
  });

  it('should generate salary record', async () => {
    const dto = { weekId: 'w1', dispatcherId: 'disp-1', adjustments: [] };
    const req = { user: { id: 'admin-1' } };
    const result = await controller.generate(dto as any, req);
    expect(result.isGenerated).toBe(true);
    expect(service.generate).toHaveBeenCalledWith('w1', 'disp-1', [], 'admin-1');
  });

  it('should find salary record by ID', async () => {
    const result = await controller.findById('sal-1');
    expect(result.id).toBe('sal-1');
    expect(result.snapshot.ruleVersion).toBe(3);
  });
});

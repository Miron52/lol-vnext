import { Test, TestingModule } from '@nestjs/testing';
import { WeeksController } from './weeks.controller';
import { WeeksService } from './weeks.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';

describe('WeeksController', () => {
  let controller: WeeksController;
  let service: Partial<WeeksService>;

  const mockWeekDto = {
    id: 'uuid-w1',
    label: 'LS2026-11',
    isoYear: 2026,
    isoWeek: 11,
    startDate: '2026-03-09',
    endDate: '2026-03-15',
    isCurrent: true,
  };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([mockWeekDto]),
      current: jest.fn().mockResolvedValue(mockWeekDto),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeeksController],
      providers: [{ provide: WeeksService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WeeksController>(WeeksController);
  });

  describe('GET /weeks', () => {
    it('should return list of weeks', async () => {
      const result = await controller.list();
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('LS2026-11');
    });
  });

  describe('GET /weeks/current', () => {
    it('should return current week with isCurrent=true', async () => {
      const result = await controller.current();
      expect(result.isCurrent).toBe(true);
      expect(result.label).toBe('LS2026-11');
    });
  });
});

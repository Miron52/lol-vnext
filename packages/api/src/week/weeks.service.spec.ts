import { Repository } from 'typeorm';
import { WeeksService } from './weeks.service';
import { Week } from './entities/week.entity';

describe('WeeksService', () => {
  let service: WeeksService;
  let repo: Partial<Repository<Week>>;

  const mockWeek: Week = {
    id: 'uuid-w1',
    label: 'LS2026-11',
    isoYear: 2026,
    isoWeek: 11,
    startDate: '2026-03-09',
    endDate: '2026-03-15',
    createdAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([mockWeek]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'uuid-new', ...data, createdAt: new Date() })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    service = new WeeksService(repo as Repository<Week>);
  });

  describe('list', () => {
    it('should return weeks with isCurrent flag', async () => {
      const result = await service.list();
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('LS2026-11');
      expect(result[0]).toHaveProperty('isCurrent');
      expect(repo.find).toHaveBeenCalledWith({
        order: { isoYear: 'DESC', isoWeek: 'DESC' },
      });
    });
  });

  describe('current', () => {
    it('should return a WeekDto with isCurrent=true', async () => {
      const result = await service.current();
      expect(result.isCurrent).toBe(true);
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
    });
  });

  describe('findOrCreate', () => {
    it('should return existing week if found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockWeek);
      const result = await service.findOrCreate(2026, 11);
      expect(result.label).toBe('LS2026-11');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should create and save a new week if not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findOrCreate(2026, 12);
      expect(result.label).toBe('LS2026-12');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('findByLabel', () => {
    it('should delegate to repo', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockWeek);
      const result = await service.findByLabel('LS2026-11');
      expect(result).toEqual(mockWeek);
    });
  });
});

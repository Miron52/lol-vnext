import { HealthService } from './health.service';
import { DataSource } from 'typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let mockDataSource: Partial<DataSource>;

  beforeEach(() => {
    mockDataSource = { query: jest.fn() };
    service = new HealthService(mockDataSource as DataSource);
  });

  it('should return "ok" when DB is reachable', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('version');
    expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return "degraded" when DB is unreachable', async () => {
    (mockDataSource.query as jest.Mock).mockRejectedValue(
      new Error('Connection refused'),
    );

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result).toHaveProperty('timestamp');
  });
});
